-- =============================================================================
-- MyMenu — 0007 — the daily order number resets at the wrong midnight
--
-- A real bug, found by placing two orders one second apart and watching both
-- come back as order #1 while 64 orders already existed that day.
--
-- The cause is one line in place_order:
--
--   and created_at >= (now() at time zone v_restaurant.timezone)::date
--
-- `now() at time zone 'Asia/Dubai'` gives a *naive* timestamp in Dubai local
-- time. `::date` then gives the Dubai date. But `created_at` is timestamptz, so
-- comparing the two makes Postgres promote that bare date using the **session**
-- timezone, which on Supabase is UTC. The cutoff therefore lands on midnight
-- UTC of the Dubai date, four hours after Dubai's own midnight.
--
-- So for the four hours between 00:00 and 04:00 Dubai time, the filter excludes
-- every order from the current Dubai day, max(daily_number) is null, and every
-- new order is numbered 1. Two live orders on the same pass, both called "one",
-- during the exact hours a UAE restaurant is busiest.
--
-- The fix converts local midnight back into a timestamptz, so both sides of the
-- comparison are absolute moments. It also stays sargable, which matters —
-- orders_restaurant_created_idx is on (restaurant_id, created_at desc), and
-- wrapping created_at in a function instead would have thrown that away.
--
-- Everything else in this function is byte-for-byte 0004.
--
-- Safe to run more than once.
-- =============================================================================

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
  v_day_start   timestamptz;
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

  -- Midnight where the restaurant is, as an absolute moment. The inner
  -- `at time zone` produces the local wall-clock date; the outer one reads that
  -- wall clock back as a real instant in the restaurant's zone.
  v_day_start :=
    ((now() at time zone v_restaurant.timezone)::date)
      at time zone v_restaurant.timezone;

  select coalesce(max(daily_number), 0) + 1 into v_daily
  from orders
  where restaurant_id = v_restaurant.id
    and created_at >= v_day_start;

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

revoke all on function place_order(text, fulfilment_mode, text, jsonb, integer, text, text, double precision, double precision) from public;
grant execute on function place_order(text, fulfilment_mode, text, jsonb, integer, text, text, double precision, double precision)
  to anon, authenticated;
