-- 0008 — six more languages: Spanish, German, Hindi, Chinese, Turkish, Russian.
--
-- profiles.language was checked against ('en','ar'), so the database rejected
-- every other value outright: the app could offer Spanish, the switcher could
-- write the cookie, and then saving it to the profile would fail the
-- constraint. Widening the check is the whole change.
--
-- Nothing existing moves. Every current row holds 'en' or 'ar', both of which
-- stay legal, so this is additive and safe to run on a live database.
--
-- HOW TO APPLY: paste this file into the Supabase SQL Editor and press Run.
-- There is no CLI on these machines and the PostgREST keys cannot run DDL, so
-- writing this file changed nothing on its own.

-- The old constraint was declared inline in 0001 and so was never given a name
-- by hand — Postgres picked one. Find it rather than guess it, because dropping
-- the wrong name silently leaves the old rule in force and the bug intact.
do $$
declare
  existing record;
begin
  for existing in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%language%'
  loop
    execute format(
      'alter table public.profiles drop constraint %I',
      existing.conname
    );
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_language_check
  check (language in ('en','ar','es','de','hi','zh','tr','ru'));

-- Verify it landed. This should print the widened list; if it prints only
-- ('en','ar') the block above did not run.
--
--   select pg_get_constraintdef(oid)
--   from pg_constraint
--   where conname = 'profiles_language_check';
