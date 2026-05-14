-- Conspiracy Pictionary Supabase setup
-- Paste this file into the Supabase SQL Editor and run it once.

create table if not exists public.pictionary_rooms (
    id bigint generated always as identity primary key,
    room_code text unique not null,
    theory text not null,
    player1 text,
    player1_id uuid references auth.users(id),
    player2 text,
    player2_id uuid references auth.users(id),
    drawer text,
    drawer_id uuid references auth.users(id),
    guesser text,
    guesser_id uuid references auth.users(id),
    player1_score integer default 0,
    player2_score integer default 0,
    round_number integer default 1,
    status text default 'waiting',
    winner text,
    winner_id uuid references auth.users(id),
    ended_at timestamptz,
    created_at timestamptz default timezone('utc', now()),
    updated_at timestamptz default timezone('utc', now())
);

alter table public.pictionary_rooms add column if not exists player1_id uuid references auth.users(id);
alter table public.pictionary_rooms add column if not exists player2_id uuid references auth.users(id);
alter table public.pictionary_rooms add column if not exists drawer_id uuid references auth.users(id);
alter table public.pictionary_rooms add column if not exists guesser_id uuid references auth.users(id);
alter table public.pictionary_rooms add column if not exists winner text;
alter table public.pictionary_rooms add column if not exists winner_id uuid references auth.users(id);
alter table public.pictionary_rooms add column if not exists ended_at timestamptz;
alter table public.pictionary_rooms add column if not exists updated_at timestamptz default timezone('utc', now());

alter table public.pictionary_rooms enable row level security;
alter table public.pictionary_rooms replica identity full;

grant select, insert, update on public.pictionary_rooms to authenticated;
grant usage, select on sequence public.pictionary_rooms_id_seq to authenticated;

drop policy if exists "Pictionary rooms are readable to signed in users" on public.pictionary_rooms;
drop policy if exists "Signed in users can create pictionary rooms" on public.pictionary_rooms;
drop policy if exists "Room participants can update pictionary rooms" on public.pictionary_rooms;
drop policy if exists "Anyone can read pictionary rooms" on public.pictionary_rooms;
drop policy if exists "Anyone can create pictionary rooms" on public.pictionary_rooms;
drop policy if exists "Anyone can update pictionary rooms" on public.pictionary_rooms;

create policy "Pictionary rooms are readable to signed in users"
on public.pictionary_rooms
for select
to authenticated
using (true);

create policy "Signed in users can create pictionary rooms"
on public.pictionary_rooms
for insert
to authenticated
with check (auth.uid() = player1_id);

create policy "Room participants can update pictionary rooms"
on public.pictionary_rooms
for update
to authenticated
using (
    auth.uid() = player1_id
    or auth.uid() = player2_id
    or player2_id is null
)
with check (
    auth.uid() = player1_id
    or auth.uid() = player2_id
);

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'pictionary_rooms'
    ) then
        alter publication supabase_realtime add table public.pictionary_rooms;
    end if;
end $$;
