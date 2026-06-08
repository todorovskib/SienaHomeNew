/*
  # Commerce, Analytics, and Checkout

  1. Restores visible product prices after older zero-price migration
  2. Adds first-party analytics events for consented click tracking
  3. Adds checkout order tables for payment-provider handoff
*/

update public.products
set
  price = case slug
    when 'mini' then 799
    when 'mini-vanity' then 799
    when 'silver' then 449
    when 'silver-storage' then 449
    when 'classic' then 129
    when 'classic-shelf' then 129
    when 'lila' then 499
    when 'lila-compact' then 499
    when 'style' then 89
    when 'style-caddy' then 89
    when 'prestige' then 349
    when 'prestige-mirror' then 349
    when 'klasik' then 899
    when 'klasik-55' then 899
    when 'klasik-65' then 999
    when 'klasik-visechko' then 999
    when 'klasik-visechko-55' then 999
    when 'klasik-visechko-65' then 999
    when 'trio' then 949
    when 'trio-55' then 949
    when 'trio-65' then 1099
    when 'trio-luks-visechko' then 1099
    when 'shkaf-za-banja' then 449
    when 'shkaf-za-banja-dupli' then 699
    else price
  end,
  updated_at = now()
where slug in (
  'mini',
  'mini-vanity',
  'silver',
  'silver-storage',
  'classic',
  'classic-shelf',
  'lila',
  'lila-compact',
  'style',
  'style-caddy',
  'prestige',
  'prestige-mirror',
  'klasik',
  'klasik-55',
  'klasik-65',
  'klasik-visechko',
  'klasik-visechko-55',
  'klasik-visechko-65',
  'trio',
  'trio-55',
  'trio-65',
  'trio-luks-visechko',
  'shkaf-za-banja',
  'shkaf-za-banja-dupli'
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  session_id text,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  event_name text not null,
  entity_type text,
  entity_id text,
  page_path text,
  language text,
  referrer text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at desc);
create index if not exists idx_analytics_events_event_name on public.analytics_events(event_name);
create index if not exists idx_analytics_events_entity on public.analytics_events(entity_type, entity_id);
create index if not exists idx_analytics_events_visitor on public.analytics_events(visitor_id);

alter table public.analytics_events enable row level security;

drop policy if exists "Anyone can insert analytics events" on public.analytics_events;
drop policy if exists "Admins can view analytics events" on public.analytics_events;
drop policy if exists "Admins can delete analytics events" on public.analytics_events;

create policy "Anyone can insert analytics events"
  on public.analytics_events
  for insert
  with check (true);

create policy "Admins can view analytics events"
  on public.analytics_events
  for select
  using (public.is_admin());

create policy "Admins can delete analytics events"
  on public.analytics_events
  for delete
  using (public.is_admin());

create table if not exists public.checkout_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  analytics_visitor_id text,
  provider text not null default 'stripe',
  provider_session_id text,
  checkout_url text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'failed')),
  currency text not null default 'MKD',
  amount_total numeric not null default 0,
  customer_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkout_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.checkout_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_slug text,
  unit_price numeric not null,
  quantity integer not null check (quantity > 0),
  line_total numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_checkout_orders_status on public.checkout_orders(status);
create index if not exists idx_checkout_orders_created_at on public.checkout_orders(created_at desc);
create index if not exists idx_checkout_order_items_order_id on public.checkout_order_items(order_id);

alter table public.checkout_orders enable row level security;
alter table public.checkout_order_items enable row level security;

drop policy if exists "Admins can view checkout orders" on public.checkout_orders;
drop policy if exists "Admins can update checkout orders" on public.checkout_orders;
drop policy if exists "Admins can view checkout order items" on public.checkout_order_items;

create policy "Admins can view checkout orders"
  on public.checkout_orders
  for select
  using (public.is_admin());

create policy "Admins can update checkout orders"
  on public.checkout_orders
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can view checkout order items"
  on public.checkout_order_items
  for select
  using (public.is_admin());
