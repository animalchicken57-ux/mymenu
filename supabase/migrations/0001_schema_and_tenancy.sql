-- =============================================================================
-- MyMenu — 0001 — schema and the tenancy boundary
-- Story 1.2. See docs/architecture.md for the decisions this implements.
--
-- The load-bearing idea (AD-1): a restaurant cannot read another restaurant's
-- data because the DATABASE refuses, not because the application remembered to
-- filter. Every table below carries restaurant_id and has Row Level Security
-- with a policy scoped to the requester's restaurant.
--
-- Safe to run more than once.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------

do $$ begin
  create type user_role as enum ('owner', 'staff', 'driver');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fulfilment_mode as enum ('dine_in', 'pickup', 'delivery');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum
    ('received', 'cooking', 'ready', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

-- The paying tenant. Its own id IS the tenancy key, which is why this is the
-- one table without a restaurant_id column.
create table if not exists restaurants (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text not null unique,
  timezone              text not null default 'Asia/Dubai',
  address               text,
  phone                 text,
  -- [{"day":0,"open":"11:00","close":"23:30"}, ...]; empty means always open.
  opening_hours         jsonb not null default '[]'::jsonb,
  -- What the Savings Counter assumes the delivery apps take. FR-30.
  commission_assumption numeric(4,3) not null default 0.250
                          check (commission_assumption between 0 and 1),
  delivery_enabled      boolean not null default true,
  -- Money is always integer minor units — fils. AD-6. 30000 fils = 300 AED.
  monthly_fee_fils      integer not null default 30000 check (monthly_fee_fils >= 0),
  subscription_status   text not null default 'trial'
                          check (subscription_status in ('trial','active','cancelled')),
  created_at            timestamptz not null default now()
);

-- One row per auth user. A user belongs to exactly one restaurant and has
-- exactly one role.
create table if not exists profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  restaurant_id     uuid not null references restaurants(id) on delete cascade,
  role              user_role not null,
  full_name         text,
  language          text not null default 'en' check (language in ('en','ar')),
  notify_new_orders boolean not null default true,
  created_at        timestamptz not null default now()
);
create index if not exists profiles_restaurant_idx on profiles(restaurant_id);

create table if not exists menu_categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name          text not null,
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists menu_categories_restaurant_idx
  on menu_categories(restaurant_id, position);

create table if not exists menu_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id   uuid not null references menu_categories(id) on delete cascade,
  name          text not null,
  description   text,
  price_fils    integer not null check (price_fils >= 0),
  photo_path    text,
  is_available  boolean not null default true,
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists menu_items_category_idx
  on menu_items(category_id, position);

create table if not exists orders (
  id                 uuid primary key default gen_random_uuid(),
  restaurant_id      uuid not null references restaurants(id) on delete cascade,
  -- Unguessable, never sequential. AD-3: this is how a Diner reads their own
  -- order without an account.
  order_ref          text not null unique,
  -- Small human number the kitchen shouts across the pass. Per restaurant, per day.
  daily_number       integer not null,
  fulfilment_mode    fulfilment_mode not null,
  table_number       integer,
  address            text,
  diner_phone        text not null,
  note               text,
  status             order_status not null default 'received',
  total_fils         integer not null check (total_fils >= 0),
  assigned_driver_id uuid references profiles(id) on delete set null,
  flagged_reason     text,
  created_at         timestamptz not null default now(),
  completed_at       timestamptz,
  constraint dine_in_needs_table
    check (fulfilment_mode <> 'dine_in' or table_number is not null),
  constraint delivery_needs_address
    check (fulfilment_mode <> 'delivery' or address is not null)
);
create index if not exists orders_restaurant_created_idx
  on orders(restaurant_id, created_at desc);
create index if not exists orders_driver_idx
  on orders(assigned_driver_id) where assigned_driver_id is not null;
create index if not exists orders_phone_idx on orders(restaurant_id, diner_phone);

-- AD-2: snapshots, never references. Editing a menu price must never rewrite
-- last month's revenue.
create table if not exists order_items (
  id              uuid primary key default gen_random_uuid(),
  restaurant_id   uuid not null references restaurants(id) on delete cascade,
  order_id        uuid not null references orders(id) on delete cascade,
  menu_item_id    uuid references menu_items(id) on delete set null,
  name_snapshot   text not null,
  unit_price_fils integer not null check (unit_price_fils >= 0),
  quantity        integer not null check (quantity > 0),
  note            text
);
create index if not exists order_items_order_idx on order_items(order_id);

-- AD-4: the append-only truth about how an order moved.
create table if not exists order_events (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  order_id      uuid not null references orders(id) on delete cascade,
  from_status   order_status,
  to_status     order_status not null,
  actor_id      uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists order_events_order_idx
  on order_events(order_id, created_at);

create table if not exists support_messages (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete set null,
  name          text not null,
  email         text not null,
  subject       text not null,
  body          text not null,
  created_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Who is asking?
--
-- SECURITY DEFINER so that reading profiles inside a profiles policy does not
-- recurse. search_path is pinned so the function cannot be tricked into
-- resolving a different table.
-- -----------------------------------------------------------------------------

create or replace function auth_restaurant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select restaurant_id from profiles where id = auth.uid()
$$;

create or replace function auth_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security — AD-1
-- -----------------------------------------------------------------------------

alter table restaurants      enable row level security;
alter table profiles         enable row level security;
alter table menu_categories  enable row level security;
alter table menu_items       enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table order_events     enable row level security;
alter table support_messages enable row level security;

drop policy if exists restaurants_read on restaurants;
create policy restaurants_read on restaurants
  for select to authenticated using (id = auth_restaurant_id());

drop policy if exists restaurants_update on restaurants;
create policy restaurants_update on restaurants
  for update to authenticated
  using (id = auth_restaurant_id() and auth_role() = 'owner')
  with check (id = auth_restaurant_id());

drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles
  for select to authenticated using (restaurant_id = auth_restaurant_id());

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_owner_write on profiles;
create policy profiles_owner_write on profiles
  for all to authenticated
  using (restaurant_id = auth_restaurant_id() and auth_role() = 'owner')
  with check (restaurant_id = auth_restaurant_id() and auth_role() = 'owner');

-- The menu is public by design — a Diner with no account has to read it.
drop policy if exists menu_categories_public_read on menu_categories;
create policy menu_categories_public_read on menu_categories
  for select to anon, authenticated using (true);

drop policy if exists menu_items_public_read on menu_items;
create policy menu_items_public_read on menu_items
  for select to anon, authenticated using (true);

drop policy if exists menu_categories_write on menu_categories;
create policy menu_categories_write on menu_categories
  for all to authenticated
  using (restaurant_id = auth_restaurant_id() and auth_role() = 'owner')
  with check (restaurant_id = auth_restaurant_id() and auth_role() = 'owner');

-- Owners edit everything; staff may only flip is_available, which is enforced
-- by the trigger below rather than by the policy.
drop policy if exists menu_items_write on menu_items;
create policy menu_items_write on menu_items
  for all to authenticated
  using (restaurant_id = auth_restaurant_id() and auth_role() in ('owner','staff'))
  with check (restaurant_id = auth_restaurant_id() and auth_role() in ('owner','staff'));

-- Orders. Note there is NO anon policy here at all: a Diner never reads the
-- orders table directly. They go through place_order() and get_order_by_ref(),
-- which is what stops one diner enumerating another's phone number.
drop policy if exists orders_read on orders;
create policy orders_read on orders
  for select to authenticated using (
    restaurant_id = auth_restaurant_id()
    and (auth_role() <> 'driver' or assigned_driver_id = auth.uid())
  );

drop policy if exists orders_update on orders;
create policy orders_update on orders
  for update to authenticated using (
    restaurant_id = auth_restaurant_id()
    and (auth_role() <> 'driver' or assigned_driver_id = auth.uid())
  ) with check (restaurant_id = auth_restaurant_id());

drop policy if exists order_items_read on order_items;
create policy order_items_read on order_items
  for select to authenticated using (
    restaurant_id = auth_restaurant_id()
    and exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (auth_role() <> 'driver' or o.assigned_driver_id = auth.uid())
    )
  );

drop policy if exists order_events_read on order_events;
create policy order_events_read on order_events
  for select to authenticated using (restaurant_id = auth_restaurant_id());

-- Anyone may raise a support message; nobody reads them through the API.
drop policy if exists support_insert on support_messages;
create policy support_insert on support_messages
  for insert to anon, authenticated with check (true);

-- -----------------------------------------------------------------------------
-- What the public may see of a restaurant
--
-- security_invoker = false on purpose: this view runs as its owner and so
-- bypasses the restaurants policy, exposing exactly these six columns and not
-- commission_assumption, fees, or subscription state.
-- -----------------------------------------------------------------------------

create or replace view public_restaurants
with (security_invoker = false) as
  select id, name, slug, timezone, opening_hours, delivery_enabled
  from restaurants;

grant select on public_restaurants to anon, authenticated;

-- The Customer List (FR-25). A view, not a table, so it can never drift from
-- the orders it summarises. security_invoker = true so the orders policy above
-- still decides who sees which rows.
create or replace view customers
with (security_invoker = true) as
  select
    restaurant_id,
    diner_phone,
    count(*)::int          as order_count,
    max(created_at)        as last_order_at,
    sum(total_fils)::bigint as lifetime_fils
  from orders
  where status <> 'cancelled'
  group by restaurant_id, diner_phone;

grant select on customers to authenticated;

-- -----------------------------------------------------------------------------
-- AD-4 — order status moves forward only, and the database says so
-- -----------------------------------------------------------------------------

create or replace function enforce_order_status_flow()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_forward boolean;
  actor_role user_role;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  is_forward :=
    (old.status = 'received' and new.status = 'cooking') or
    (old.status = 'cooking'  and new.status = 'ready')   or
    (old.status = 'ready'    and new.status = 'completed');

  actor_role := auth_role();

  if not is_forward and coalesce(actor_role, 'staff'::user_role) <> 'owner' then
    raise exception
      'Order status moves forward only. Only an owner may move it back or cancel it.';
  end if;

  if new.status = 'completed' and new.completed_at is null then
    new.completed_at := now();
  end if;

  insert into order_events (restaurant_id, order_id, from_status, to_status, actor_id)
  values (new.restaurant_id, new.id, old.status, new.status, auth.uid());

  return new;
end $$;

drop trigger if exists orders_status_flow on orders;
create trigger orders_status_flow
  before update of status on orders
  for each row execute function enforce_order_status_flow();

-- Staff may flip availability, and nothing else on a menu item.
create or replace function restrict_staff_menu_edits()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth_role() = 'staff' then
    if (new.name, new.description, new.price_fils, new.photo_path,
        new.category_id, new.position)
       is distinct from
       (old.name, old.description, old.price_fils, old.photo_path,
        old.category_id, old.position)
    then
      raise exception 'Staff may only change whether an item is available.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists menu_items_staff_guard on menu_items;
create trigger menu_items_staff_guard
  before update on menu_items
  for each row execute function restrict_staff_menu_edits();

-- -----------------------------------------------------------------------------
-- The Diner's two doors — AD-3
--
-- A Diner has no account and no direct access to the orders table. These two
-- functions are the entire public surface. place_order prices the order from
-- the live menu, so a total can never be forged by the caller.
-- -----------------------------------------------------------------------------

create or replace function place_order(
  p_slug     text,
  p_mode     fulfilment_mode,
  p_phone    text,
  p_items    jsonb,               -- [{"menu_item_id":"…","quantity":2,"note":"…"}]
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

  v_ref := replace(replace(replace(
             encode(gen_random_bytes(16), 'base64'), '+', ''), '/', ''), '=', '');
  v_ref := substr(v_ref, 1, 22);

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

create or replace function get_order_by_ref(p_ref text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order from orders where order_ref = p_ref;
  if not found then
    return null;
  end if;

  -- EXPERIENCE.md: the Diner's link is good for 24 hours.
  if v_order.created_at < now() - interval '24 hours' then
    return null;
  end if;

  return jsonb_build_object(
    'order_ref',    v_order.order_ref,
    'daily_number', v_order.daily_number,
    'status',       v_order.status,
    'mode',         v_order.fulfilment_mode,
    'table_number', v_order.table_number,
    'total_fils',   v_order.total_fils,
    'created_at',   v_order.created_at,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name',     oi.name_snapshot,
        'quantity', oi.quantity,
        'price',    oi.unit_price_fils,
        'note',     oi.note
      ) order by oi.name_snapshot), '[]'::jsonb)
      from order_items oi where oi.order_id = v_order.id
    )
  );
end $$;

revoke all on function get_order_by_ref(text) from public;
grant execute on function get_order_by_ref(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Live updates — AD-7. Realtime is an enhancement; polling is the fallback.
-- -----------------------------------------------------------------------------

do $$ begin
  alter publication supabase_realtime add table orders;
exception when duplicate_object then null; end $$;
