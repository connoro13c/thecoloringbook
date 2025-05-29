-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Anonymous sessions table (temporary tracking)
create table public.page_sessions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now()
);

-- Authenticated user pages table (permanent)
create table public.pages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  prompt text not null,
  style text not null,
  difficulty integer check (difficulty >= 1 and difficulty <= 5),
  jpg_path text,
  pdf_path text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.page_sessions enable row level security;
alter table public.pages enable row level security;

-- RLS policies for pages table
create policy "Users can view own pages" on public.pages
  for select using (auth.uid() = user_id);

create policy "Users can insert own pages" on public.pages
  for insert with check (auth.uid() = user_id);

create policy "Users can update own pages" on public.pages
  for update using (auth.uid() = user_id);

create policy "Users can delete own pages" on public.pages
  for delete using (auth.uid() = user_id);

-- Anonymous sessions are public (for temporary tracking)
create policy "Anonymous sessions are public" on public.page_sessions
  for all using (true);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_pages_updated_at
  before update on public.pages
  for each row execute procedure public.handle_updated_at();
