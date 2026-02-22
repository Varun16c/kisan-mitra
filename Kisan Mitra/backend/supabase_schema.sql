-- Kisan Mitra — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run

-- Enable UUID extension (already enabled by default)
create extension if not exists "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
create table if not exists public.users (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text,
  name         text,
  phone        text,
  language_preference text default 'en',
  profile      jsonb default '{}'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Chat history table
create table if not exists public.chat_history (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.users(id) on delete cascade,
  role       text check (role in ('user', 'assistant')),
  content    text,
  language   text default 'en',
  created_at timestamptz default now()
);

-- Allow authenticated users to manage their own rows
alter table public.users enable row level security;
alter table public.chat_history enable row level security;

create policy "Users can view own profile"     on public.users for select using (auth.uid() = id);
create policy "Users can update own profile"   on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile"   on public.users for insert with check (auth.uid() = id);

create policy "Users can view own chats"       on public.chat_history for select using (auth.uid() = user_id);
create policy "Users can insert own chats"     on public.chat_history for insert with check (auth.uid() = user_id);

-- Service role can do everything (for backend service key)
create policy "Service role full access users" on public.users for all using (true);
create policy "Service role full access chats" on public.chat_history for all using (true);
