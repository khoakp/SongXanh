-- Synchronize auth.users into public.users. Run after functions.sql and before seed.sql.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  fallback_name text := split_part(coalesce(new.email, ''), '@', 1);
begin
  insert into public.users (id, display_name, school, faculty, class_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(trim(meta->>'display_name'), ''), nullif(trim(meta->>'full_name'), ''), nullif(trim(meta->>'name'), ''), fallback_name),
    coalesce(trim(meta->>'school'), ''),
    coalesce(trim(meta->>'faculty'), ''),
    coalesce(trim(meta->>'class_name'), ''),
    nullif(coalesce(meta->>'avatar_url', meta->>'picture'), '')
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.users (id, display_name, school, faculty, class_name, avatar_url)
select
  au.id,
  coalesce(nullif(trim(meta->>'display_name'), ''), nullif(trim(meta->>'full_name'), ''), nullif(trim(meta->>'name'), ''), split_part(coalesce(au.email, ''), '@', 1)),
  coalesce(trim(meta->>'school'), ''),
  coalesce(trim(meta->>'faculty'), ''),
  coalesce(trim(meta->>'class_name'), ''),
  nullif(coalesce(meta->>'avatar_url', meta->>'picture'), '')
from auth.users au
cross join lateral (select coalesce(au.raw_user_meta_data, '{}'::jsonb) as meta) normalized
on conflict (id) do nothing;
