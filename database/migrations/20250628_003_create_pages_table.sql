-- Migration 003: Create pages table for authenticated users
-- This table stores permanent coloring pages for signed-in users

create table pages (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users not null,
  prompt      text,
  style       text,
  difficulty  integer default 3,
  jpg_path    text,
  pdf_path    text,
  deleted_at  timestamp,
  created_at  timestamp default now(),
  updated_at  timestamp default now()
);

-- Index for efficient user page queries
create unique index idx_pages_user_created
  on pages (user_id, created_at desc);

-- Index for soft delete queries
create index idx_pages_not_deleted
  on pages (user_id, created_at desc)
  where deleted_at is null;

-- Update timestamp trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_pages_updated_at
  before update on pages
  for each row
  execute procedure update_updated_at_column();
