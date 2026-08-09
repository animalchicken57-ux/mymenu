-- =============================================================================
-- MyMenu — 0006 — photographs of the food, and of the room
--
-- Story 2.3. menu_items.photo_path has existed since 0001 and nothing has ever
-- written to it. This gives it somewhere to point, and adds the one photo that
-- is not a dish: the restaurant's own cover picture, behind its name.
--
-- The bucket is public to read, because a Diner with no account has to see the
-- picture — same reasoning as the public menu policies in 0001. Writing is
-- another matter: an owner may only write inside a folder named after their own
-- restaurant, so one restaurant cannot reach into another's photos even though
-- they share a bucket. The cover sits at <restaurant_id>/cover.<ext> and is
-- covered by that same rule with nothing extra to write.
--
-- Safe to run more than once.
-- =============================================================================

-- The picture behind the restaurant's name on its ordering page.
alter table restaurants add column if not exists cover_path text;

comment on column restaurants.cover_path is
  'Object path inside the menu-photos bucket for the ordering page hero image.';

-- The public view is pinned to an explicit column list, so a new column is
-- invisible to a Diner until it is named here. Still no commission_assumption,
-- no fees, no subscription state.
create or replace view public_restaurants
with (security_invoker = false) as
  select id, name, slug, timezone, opening_hours, delivery_enabled, cover_path
  from restaurants;

grant select on public_restaurants to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-photos',
  'menu-photos',
  true,
  3145728,                                      -- 3 MB. A phone photo, resized.
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = true,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may look. This is a menu; that is the point.
drop policy if exists menu_photos_public_read on storage.objects;
create policy menu_photos_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'menu-photos');

-- Only an owner, and only inside their own restaurant's folder. The path is
-- <restaurant_id>/<item_id>.<ext>, so the first segment is the tenancy key and
-- auth_restaurant_id() comes from the session, never from the request.
drop policy if exists menu_photos_owner_write on storage.objects;
create policy menu_photos_owner_write on storage.objects
  for all to authenticated
  using (
    bucket_id = 'menu-photos'
    and auth_role() = 'owner'
    and (storage.foldername(name))[1] = auth_restaurant_id()::text
  )
  with check (
    bucket_id = 'menu-photos'
    and auth_role() = 'owner'
    and (storage.foldername(name))[1] = auth_restaurant_id()::text
  );
