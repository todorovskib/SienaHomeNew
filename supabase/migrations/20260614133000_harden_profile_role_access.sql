/*
  # Harden profile and role access

  1. Profiles are no longer publicly readable.
  2. Authenticated users can read only their own profile.
  3. Admins can read all profiles through the security-definer `is_admin` function.
  4. Client roles cannot insert/delete profiles or update role, user_id, or email.
*/

alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users and admins can view profiles" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;

create policy "Users and admins can view profiles"
  on public.profiles
  for select
  using (
    auth.uid() = user_id
    or public.is_admin()
  );

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke insert, delete on public.profiles from anon, authenticated;
revoke update on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url, updated_at) on public.profiles to authenticated;
