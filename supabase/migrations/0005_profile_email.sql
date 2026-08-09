-- =============================================================================
-- MyMenu — 0005 — a driver's login address, visible to their owner
--
-- Story 1.7. The /team page has to show the owner which email each driver signs
-- in with, and the real answer lives in auth.users, which no RLS policy lets a
-- restaurant owner read — correctly, since that table is every tenant's users
-- at once.
--
-- So the address is copied onto the profile at the moment the owner creates the
-- account. It is a display copy, not the source of truth: auth.users still owns
-- the credential, and changing this column changes nothing about how anybody
-- signs in.
--
-- Safe to run more than once.
-- =============================================================================

alter table profiles add column if not exists email text;

comment on column profiles.email is
  'Display copy of auth.users.email, written when an owner enrols a team member.
   Not a credential and not authoritative — auth.users is.';

-- Backfill what we can reach: every existing user is their own auth row, and
-- this runs as the postgres role in the SQL Editor, so auth.users is readable
-- here even though it is not readable from the application.
update profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id
   and p.email is null;
