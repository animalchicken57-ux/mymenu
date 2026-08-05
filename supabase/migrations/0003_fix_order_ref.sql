-- =============================================================================
-- MyMenu — 0003 — fix order-reference generation
--
-- Bug: place_order() called gen_random_bytes(), which lives in pgcrypto. On
-- Supabase pgcrypto is installed in the `extensions` schema, and the function
-- pins `search_path = public` (deliberately — an unpinned search_path is how a
-- SECURITY DEFINER function gets tricked into resolving somebody else's table).
-- So every order failed with "function gen_random_bytes(integer) does not exist".
--
-- Caught by scripts/order-flow-test.mjs before it ever reached a diner.
--
-- Fix: build the reference from gen_random_uuid(), which is core Postgres and
-- always resolvable. Two uuids give 22 hex characters — about 88 bits — which
-- is still far past guessable, and AD-3 only asks that the reference be
-- unguessable and non-sequential.
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
  p_note     text    default null
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
    table_number, address, diner_phone, note, status, total_fils
  ) values (
    v_order_id, v_restaurant.id, v_ref, v_daily, p_mode,
    p_table, p_address, p_phone, p_note, 'received', 0
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

revoke all on function place_order(text, fulfilment_mode, text, jsonb, integer, text, text) from public;
grant execute on function place_order(text, fulfilment_mode, text, jsonb, integer, text, text)
  to anon, authenticated;
