-- =============================================================================
-- MyMenu — 0002 — creating a restaurant at signup
--
-- Story 1.3. A brand-new user has no profile yet, so auth_restaurant_id()
-- returns null and every RLS policy correctly refuses them. That is not a bug
-- to work around by reaching for the service-role key (AD-9 forbids it); it is
-- handled here, by one narrow SECURITY DEFINER function that can do exactly one
-- thing: give the caller their first restaurant, once.
--
-- Safe to run more than once.
-- =============================================================================

create or replace function bootstrap_restaurant(
  p_name text,
  p_slug text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_restaurant_id uuid;
  v_slug          text;
  v_suffix        integer := 1;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  -- Once, and only once. This is what stops the function being a way to mint
  -- restaurants forever.
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'already_has_restaurant';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'restaurant_name_required';
  end if;

  -- Slugs are public URLs, so collisions are resolved rather than rejected —
  -- a second "Al Baik" should not be told to pick a different restaurant name.
  v_slug := nullif(trim(p_slug), '');
  if v_slug is null then
    v_slug := 'restaurant';
  end if;

  while exists (select 1 from restaurants where slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := trim(p_slug) || '-' || v_suffix;
  end loop;

  insert into restaurants (name, slug)
  values (trim(p_name), v_slug)
  returning id into v_restaurant_id;

  insert into profiles (id, restaurant_id, role)
  values (auth.uid(), v_restaurant_id, 'owner');

  return jsonb_build_object('restaurant_id', v_restaurant_id, 'slug', v_slug);
end $$;

revoke all on function bootstrap_restaurant(text, text) from public, anon;
grant execute on function bootstrap_restaurant(text, text) to authenticated;

-- Who am I, in one round trip? Used by the layout on every authenticated page,
-- so it stays cheap and returns only what the shell needs.
create or replace function me()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v jsonb;
begin
  if auth.uid() is null then
    return null;
  end if;

  select jsonb_build_object(
    'user_id',       p.id,
    'restaurant_id', p.restaurant_id,
    'role',          p.role,
    'full_name',     p.full_name,
    'language',      p.language,
    'restaurant', jsonb_build_object(
      'name',                  r.name,
      'slug',                  r.slug,
      'timezone',              r.timezone,
      'delivery_enabled',      r.delivery_enabled,
      'commission_assumption', r.commission_assumption,
      'monthly_fee_fils',      r.monthly_fee_fils
    )
  )
  into v
  from profiles p
  join restaurants r on r.id = p.restaurant_id
  where p.id = auth.uid();

  return v;
end $$;

revoke all on function me() from public, anon;
grant execute on function me() to authenticated;
