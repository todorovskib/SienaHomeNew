/*
  # Admin Product Management Hardening

  1. Profiles
    - Ensure `profiles` table exists and has expected columns
    - Enforce one profile per auth user
    - Keep automatic profile creation on signup

  2. Products
    - Ensure product columns exist for CRUD
    - Keep slug indexed and unique
    - Track `created_by` and `updated_by` using profile ids

  3. Security
    - Remove permissive product policies from older migrations
    - Public can read published products
    - Admins can read all products and mutate products
*/

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

alter table public.profiles alter column role set default 'user';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('admin', 'user'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_user_id_key'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_user_id_key unique (user_id);
  end if;
end
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text not null,
  price numeric not null default 0,
  description text not null default '',
  features jsonb default '[]'::jsonb,
  colors jsonb default '[]'::jsonb,
  dimensions jsonb default '{}'::jsonb,
  specifications jsonb default '{}'::jsonb,
  main_image_url text not null default '',
  additional_images jsonb default '[]'::jsonb,
  in_stock boolean default true,
  is_published boolean default true,
  sort_order integer default 0,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products add column if not exists slug text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists price numeric not null default 0;
alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists features jsonb default '[]'::jsonb;
alter table public.products add column if not exists colors jsonb default '[]'::jsonb;
alter table public.products add column if not exists dimensions jsonb default '{}'::jsonb;
alter table public.products add column if not exists specifications jsonb default '{}'::jsonb;
alter table public.products add column if not exists main_image_url text;
alter table public.products add column if not exists additional_images jsonb default '[]'::jsonb;
alter table public.products add column if not exists in_stock boolean default true;
alter table public.products add column if not exists is_published boolean default true;
alter table public.products add column if not exists sort_order integer default 0;
alter table public.products add column if not exists created_by uuid references public.profiles(id);
alter table public.products add column if not exists updated_by uuid references public.profiles(id);
alter table public.products add column if not exists created_at timestamptz default now();
alter table public.products add column if not exists updated_at timestamptz default now();

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_published on public.products(is_published);
create index if not exists idx_products_sort_order on public.products(sort_order);
create unique index if not exists idx_products_slug_unique on public.products(slug);

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = check_user
      and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_product_audit_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid;
begin
  select id into profile_id
  from public.profiles
  where user_id = auth.uid();

  if tg_op = 'INSERT' then
    if new.created_by is null then
      new.created_by := profile_id;
    end if;
    if new.created_at is null then
      new.created_at := now();
    end if;
  end if;

  new.updated_by := profile_id;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_product_audit_fields on public.products;
create trigger set_product_audit_fields
  before insert or update on public.products
  for each row execute procedure public.set_product_audit_fields();

alter table public.profiles enable row level security;
alter table public.products enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Public profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Public can view published products" on public.products;
drop policy if exists "Authenticated users can view all products" on public.products;
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;
drop policy if exists "Published products are viewable by everyone" on public.products;
drop policy if exists "Admins can view all products" on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;

create policy "Public can view published products"
  on public.products
  for select
  using (is_published = true or public.is_admin());

create policy "Admins can insert products"
  on public.products
  for insert
  with check (public.is_admin());

create policy "Admins can update products"
  on public.products
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete products"
  on public.products
  for delete
  using (public.is_admin());
