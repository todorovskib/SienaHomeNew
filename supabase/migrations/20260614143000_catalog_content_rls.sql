/*
  # Catalog, content, and profile Row Level Security

  This migration replaces all existing policies on profiles, products,
  product_images, content_blocks, and content_versions with one explicit access
  model:

  - Anonymous and regular authenticated users can read published products and
    published content blocks, plus images belonging to published products.
  - Admin users can read all products/content and create, update, or delete them.
  - Authenticated users can read only their own profile; admins can read all
    profiles.
  - Content history remains admin-only because it can contain unpublished text.
  - Browser clients cannot assign or change profile roles.

  The frontend uses only the Supabase anon key. Service-role credentials remain
  server-side in Supabase Edge Function secrets and bypass RLS only there.
*/

-- RLS must be enabled before policies can restrict API access.
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.content_blocks enable row level security;
alter table public.content_versions enable row level security;

/*
  Central admin check used by all policies.

  SECURITY DEFINER lets this function read profiles without recursively invoking
  the profiles SELECT policy. It returns true only when the current auth user has
  a profile whose role is exactly "admin".
*/
create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (
    check_user = auth.uid()
    and exists (
      select 1
      from public.profiles
      where user_id = auth.uid()
        and role = 'admin'
    )
  );
$$;

-- Do not expose the helper broadly; only Supabase API roles need to execute it.
revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated;

/*
  Remove every legacy policy on the relevant tables before creating canonical
  policies below. PostgreSQL combines permissive policies with OR, so leaving an
  older broad policy in place could bypass the intended restrictions.
*/
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'products',
        'product_images',
        'content_blocks',
        'content_versions'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

-- Profiles: users may read their own row; admins may read all profile rows.
create policy "Profiles are readable by owner or admin"
  on public.profiles
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_admin()
  );

/*
  Profiles: users may edit only their own row. Column-level grants below limit
  browser updates to full_name, avatar_url, and updated_at, preventing role,
  email, and user_id changes.
*/
create policy "Users can update their own profile fields"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

/*
  Products: everyone can read published rows. Admins also see unpublished rows,
  which keeps the admin dashboard usable without exposing drafts publicly.
*/
create policy "Published products are public and admins see all"
  on public.products
  for select
  to anon, authenticated
  using (
    is_published = true
    or public.is_admin()
  );

-- Products: only authenticated users with profiles.role = 'admin' may insert.
create policy "Admins can insert products"
  on public.products
  for insert
  to authenticated
  with check (public.is_admin());

-- Products: only admins may update; both old and resulting rows are checked.
create policy "Admins can update products"
  on public.products
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Products: only admins may delete product rows.
create policy "Admins can delete products"
  on public.products
  for delete
  to authenticated
  using (public.is_admin());

/*
  Product images: public users can see an image only when its parent product is
  published. Admins can see images for draft products as well.
*/
create policy "Published product images are public and admins see all"
  on public.product_images
  for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.products p
      where p.id = product_id
        and p.is_published = true
    )
  );

-- Product images: only admins may attach images to products.
create policy "Admins can insert product images"
  on public.product_images
  for insert
  to authenticated
  with check (public.is_admin());

-- Product images: only admins may edit image metadata or parent associations.
create policy "Admins can update product images"
  on public.product_images
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Product images: only admins may delete product image rows.
create policy "Admins can delete product images"
  on public.product_images
  for delete
  to authenticated
  using (public.is_admin());

/*
  Content: everyone can read published blocks. Admins can also read drafts and
  unpublished localized content from the editing interface.
*/
create policy "Published content is public and admins see all"
  on public.content_blocks
  for select
  to anon, authenticated
  using (
    is_published = true
    or public.is_admin()
  );

-- Content: only admins may create new text/content blocks.
create policy "Admins can insert content"
  on public.content_blocks
  for insert
  to authenticated
  with check (public.is_admin());

-- Content: only admins may edit existing blocks or change publication state.
create policy "Admins can update content"
  on public.content_blocks
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Content: only admins may permanently delete content blocks.
create policy "Admins can delete content"
  on public.content_blocks
  for delete
  to authenticated
  using (public.is_admin());

-- Content history: versions may contain drafts, so only admins may read them.
create policy "Admins can read content versions"
  on public.content_versions
  for select
  to authenticated
  using (public.is_admin());

-- Content history: only admins may create version snapshots.
create policy "Admins can insert content versions"
  on public.content_versions
  for insert
  to authenticated
  with check (public.is_admin());

-- Content history: only admins may correct a version row.
create policy "Admins can update content versions"
  on public.content_versions
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Content history: only admins may delete version history.
create policy "Admins can delete content versions"
  on public.content_versions
  for delete
  to authenticated
  using (public.is_admin());

/*
  Table grants are the first permission layer; RLS policies above are the second.
  Anonymous clients receive read-only table privileges.
*/
grant usage on schema public to anon, authenticated;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url, updated_at) on public.profiles to authenticated;

revoke all on public.products from anon, authenticated;
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;

revoke all on public.product_images from anon, authenticated;
grant select on public.product_images to anon;
grant select, insert, update, delete on public.product_images to authenticated;

revoke all on public.content_blocks from anon, authenticated;
grant select on public.content_blocks to anon;
grant select, insert, update, delete on public.content_blocks to authenticated;

revoke all on public.content_versions from anon, authenticated;
grant select, insert, update, delete on public.content_versions to authenticated;
