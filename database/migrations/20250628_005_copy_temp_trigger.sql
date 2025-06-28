-- Migration 005: Trigger to copy latest temp page to user pages on signup
-- This function will copy the most recent temp page to the new user's permanent storage

create or replace function copy_latest_temp_to_user()
returns trigger as $$
declare
  latest_session_id uuid;
  session_data record;
begin
  -- Find the most recent page_session (proxy for latest temp page)
  select id into latest_session_id
  from page_sessions
  order by created_at desc
  limit 1;

  -- If we found a recent session, we'll handle the copy in the application layer
  -- This trigger mainly ensures we have hooks for future expansion
  -- The actual copy logic will be in /auth/callback route
  
  return new;
end;
$$ language plpgsql;

-- Create trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure copy_latest_temp_to_user();

-- Function to soft delete a page
create or replace function soft_delete_page(page_id uuid)
returns boolean as $$
begin
  update pages 
  set deleted_at = now()
  where id = page_id and user_id = auth.uid();
  
  return found;
end;
$$ language plpgsql security definer;
