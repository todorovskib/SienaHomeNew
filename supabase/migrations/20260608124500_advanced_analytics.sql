/*
  # Advanced Analytics

  Adds richer event dimensions and useful admin/reporting views.
*/

alter table public.analytics_events add column if not exists event_value numeric;
alter table public.analytics_events add column if not exists page_title text;
alter table public.analytics_events add column if not exists device_type text;
alter table public.analytics_events add column if not exists browser_name text;
alter table public.analytics_events add column if not exists os_name text;
alter table public.analytics_events add column if not exists viewport_width integer;
alter table public.analytics_events add column if not exists viewport_height integer;
alter table public.analytics_events add column if not exists screen_width integer;
alter table public.analytics_events add column if not exists screen_height integer;
alter table public.analytics_events add column if not exists utm_source text;
alter table public.analytics_events add column if not exists utm_medium text;
alter table public.analytics_events add column if not exists utm_campaign text;
alter table public.analytics_events add column if not exists utm_term text;
alter table public.analytics_events add column if not exists utm_content text;

create index if not exists idx_analytics_events_device_type on public.analytics_events(device_type);
create index if not exists idx_analytics_events_page_path on public.analytics_events(page_path);
create index if not exists idx_analytics_events_utm_source on public.analytics_events(utm_source);
create index if not exists idx_analytics_events_session on public.analytics_events(session_id);

create or replace view public.analytics_daily_summary
with (security_invoker = true)
as
select
  date_trunc('day', created_at)::date as event_date,
  event_name,
  count(*) as event_count,
  count(distinct visitor_id) as unique_visitors,
  count(distinct session_id) as unique_sessions,
  coalesce(sum(event_value), 0) as event_value_sum,
  round(avg(event_value)) as event_value_avg
from public.analytics_events
group by 1, 2
order by event_date desc, event_count desc;

create or replace view public.analytics_top_pages
with (security_invoker = true)
as
select
  page_path,
  count(*) filter (where event_name = 'page_view') as page_views,
  count(*) filter (where event_name = 'time_on_page') as time_events,
  round(avg(event_value) filter (where event_name = 'time_on_page')) as avg_seconds_on_page,
  count(distinct visitor_id) as unique_visitors
from public.analytics_events
where page_path is not null
group by page_path
order by page_views desc nulls last;

create or replace view public.analytics_product_funnel
with (security_invoker = true)
as
select
  coalesce(entity_id, metadata->>'product_id') as product_key,
  coalesce(metadata->>'product_name', entity_id, 'Unknown product') as product_name,
  count(*) filter (where event_name = 'product_card_click') as card_clicks,
  count(*) filter (where event_name = 'product_view') as product_views,
  count(*) filter (where event_name = 'add_to_cart') as add_to_cart,
  count(*) filter (where event_name = 'favorite_add') as favorite_adds,
  count(distinct visitor_id) as unique_visitors,
  max(created_at) as last_event_at
from public.analytics_events
where entity_type = 'product'
group by 1, 2
order by product_views desc, card_clicks desc;

create or replace view public.analytics_revenue_summary
with (security_invoker = true)
as
select
  date_trunc('day', created_at)::date as purchase_date,
  count(*) as purchases,
  coalesce(sum(event_value), 0) as revenue,
  count(distinct visitor_id) as unique_buyers
from public.analytics_events
where event_name = 'purchase_completed'
group by 1
order by purchase_date desc;

grant select on public.analytics_daily_summary to authenticated;
grant select on public.analytics_top_pages to authenticated;
grant select on public.analytics_product_funnel to authenticated;
grant select on public.analytics_revenue_summary to authenticated;
