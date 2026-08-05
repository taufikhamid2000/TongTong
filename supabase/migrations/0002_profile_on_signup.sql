-- Auto-create a tongtong_profiles row whenever a new auth.users row is
-- inserted, so every signup path (password, OAuth, magic link) ends up
-- with a profile without each Server Action having to remember to
-- insert one. full_name is read from auth metadata set at signUp() time.
--
-- auth.users already carries a trigger named "on_auth_user_created" for
-- another app (duitduit) in this shared master_db — both the function
-- and the trigger are tongtong_-prefixed here so this migration adds a
-- second, independent trigger rather than colliding with/replacing it.
-- Multiple AFTER INSERT triggers on the same table all fire independently.
create or replace function public.tongtong_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.tongtong_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists tongtong_on_auth_user_created on auth.users;
create trigger tongtong_on_auth_user_created
  after insert on auth.users
  for each row execute function public.tongtong_handle_new_user();
