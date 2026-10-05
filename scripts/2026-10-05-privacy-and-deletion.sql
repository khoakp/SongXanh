-- Idempotent privacy migration. Run after schema and RLS; safe to run repeatedly.
alter table public.commitments add column if not exists class_name text; alter table public.commitments add column if not exists faculty text;
create table if not exists public.data_deletion_requests (id uuid primary key default gen_random_uuid(),user_id uuid not null references public.users(id) on delete cascade,requested_at timestamptz not null default now(),status text not null default 'pending',processed_at timestamptz,processed_by uuid references public.users(id));
alter table public.data_deletion_requests enable row level security;
drop view if exists public.commitments_public;
create view public.commitments_public as select c.id,c.title,c.created_at,c.class_name,c.faculty,case when c.display_name then coalesce(u.display_name,'Ẩn danh') else 'Ẩn danh' end as user_name from public.commitments c left join public.users u on u.id=c.user_id;
revoke all on public.commitments from anon,authenticated; grant insert on public.commitments to authenticated; grant select on public.commitments_public to anon,authenticated;
