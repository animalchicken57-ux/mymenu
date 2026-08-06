-- =============================================================================
-- MyMenu — 0004 — a delivery order can carry a map pin
--
-- Typing an address in the UAE is genuinely hard: many buildings have no street
-- number a stranger could use, and drivers navigate by landmark. So a delivery
-- order can now carry the customer's coordinates as well as their words, and
-- the driver gets a button that opens Google Maps at the exact spot.
--
-- Coordinates are optional on purpose. Somebody ordering from a laptop, or who
-- refuses the location prompt, must still be able to order — the typed address
-- remains the requirement, and the pin is the help.
--
-- No API key and no Google SDK: the browser's own geolocation gives the point,
-- and a plain maps.google.com link opens it. Nothing to pay for, nothing to
-- expire during a presentation.
--
-- Safe to run more than once.
-- =============================================================================

alter table orders add column if not exists lat double precision;
alter table orders add column if not exists lng double precision;

alter table orders drop constraint if exists sane_coordinates;
alter table orders add constraint sane_coordinates check (
  (lat is null and lng is null)
  or (lat between -90 and 90 and lng between -180 and 180)
);

create or replace function place_order(
  p_slug     text,
  p_mode     fulfilment_mode,
  p_phone    text,
  p_items    jsonb,
  p_table    integer default null,
  p_address  text    default null,
  p_note     text    default null,
  p_lat      double precision default null,
  p_lng      double precision default null
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_restaurant  restaurants%rowtype;
  v_order_id    uuid := gen_random_uuid();
  v_ref         text;
  v_total       integer := 0;
  v_daily       integer;
  v_item        jsonb;
  v_menu_item   menu_items%rowtype;
  v_qty         integer;
begin
  select * into v_restaurant from restaurants where slug = p_slug;
  if not found then
    raise exception 'restaurant_not_found';
  end if;

  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'empty_cart';
  end if;

  if p_mode = 'delivery' and not v_restaurant.delivery_enabled then
    raise exception 'delivery_not_offered';
  end if;

  v_ref := substr(
    replace(gen_random_uuid()::text, '-', '') ||
    replace(gen_random_uuid()::text, '-', ''),
    1, 22
  );

  select coalesce(max(daily_number), 0) + 1 into v_daily
  from orders
  where restaurant_id = v_restaurant.id
    and created_at >= (now() at time zone v_restaurant.timezone)::date;

  insert into orders (
    id, restaurant_id, order_ref, daily_number, fulfilment_mode,
    table_number, address, diner_phone, note, status, total_fils, lat, lng
  ) values (
    v_order_id, v_restaurant.id, v_ref, v_daily, p_mode,
    p_table, p_address, p_phone, p_note, 'received', 0,
    case when p_mode = 'delivery' then p_lat else null end,
    case when p_mode = 'delivery' then p_lng else null end
  );

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_menu_item
    from menu_items
    where id = (v_item->>'menu_item_id')::uuid
      and restaurant_id = v_restaurant.id;

    if not found then
      raise exception 'item_not_on_this_menu';
    end if;
    if not v_menu_item.is_available then
      raise exception 'item_sold_out:%', v_menu_item.name;
    end if;

    v_qty := greatest(1, coalesce((v_item->>'quantity')::integer, 1));

    insert into order_items (
      restaurant_id, order_id, menu_item_id,
      name_snapshot, unit_price_fils, quantity, note
    ) values (
      v_restaurant.id, v_order_id, v_menu_item.id,
      v_menu_item.name, v_menu_item.price_fils, v_qty,
      nullif(v_item->>'note', '')
    );

    v_total := v_total + (v_menu_item.price_fils * v_qty);
  end loop;

  update orders set total_fils = v_total where id = v_order_id;

  insert into order_events (restaurant_id, order_id, from_status, to_status)
  values (v_restaurant.id, v_order_id, null, 'received');

  return v_ref;
end $$;

-- The 7-argument version from 0003 would otherwise still be callable and would
-- silently drop the pin.
drop function if exists place_order(text, fulfilment_mode, text, jsonb, integer, text, text);

revoke all on function place_order(text, fulfilment_mode, text, jsonb, integer, text, text, double precision, double precision) from public;
grant execute on function place_order(text, fulfilment_mode, text, jsonb, integer, text, text, double precision, double precision)
  to anon, authenticated;
