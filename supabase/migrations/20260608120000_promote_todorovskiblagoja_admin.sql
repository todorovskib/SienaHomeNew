/*
  # Promote Admin User

  Gives the Supabase auth user below admin access in the app.
  The user must already exist in Authentication > Users.
*/

do $$
declare
  admin_email text := 'todorovskiblagoja1@gmail.com';
  admin_user_id uuid;
  profile_for_user_id uuid;
  profile_for_email_id uuid;
begin
  select id
  into admin_user_id
  from auth.users
  where email = admin_email;

  if admin_user_id is null then
    raise exception 'No Supabase auth user found for %', admin_email;
  end if;

  select id
  into profile_for_user_id
  from public.profiles
  where user_id = admin_user_id;

  select id
  into profile_for_email_id
  from public.profiles
  where email = admin_email;

  if profile_for_user_id is not null and profile_for_email_id is not null and profile_for_user_id <> profile_for_email_id then
    raise exception 'Separate profiles exist for user id and email %. Merge them manually before promotion.', admin_email;
  elsif profile_for_user_id is not null then
    update public.profiles
    set
      email = admin_email,
      role = 'admin',
      updated_at = now()
    where id = profile_for_user_id;
  elsif profile_for_email_id is not null then
    update public.profiles
    set
      user_id = admin_user_id,
      role = 'admin',
      updated_at = now()
    where id = profile_for_email_id;
  else
    insert into public.profiles (user_id, email, full_name, role)
    values (admin_user_id, admin_email, '', 'admin');
  end if;
end;
$$;

drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = user_id and role = 'user');

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke update on public.profiles from anon, authenticated;
grant update (full_name, avatar_url, updated_at) on public.profiles to authenticated;
