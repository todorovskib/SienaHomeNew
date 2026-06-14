/*
  # Contact messages

  Public visitors submit contact messages through the Vercel /api/contact
  function. That function uses the Supabase service-role secret on the server,
  so no anonymous or authenticated browser insert policy is required.

  Admin users can review, update, and delete messages. Regular authenticated
  users and anonymous visitors cannot read the table.
*/

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  phone text,
  email text,
  subject text,
  message text not null check (char_length(message) between 1 and 5000),
  preferred_contact_method text not null default 'phone'
    check (preferred_contact_method in ('phone', 'email', 'whatsapp')),
  language text not null default 'mk'
    check (language in ('mk', 'en')),
  status text not null default 'new'
    check (status in ('new', 'read', 'replied', 'archived')),
  source text not null default 'website',
  user_agent text,
  handled_by uuid references public.profiles(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_messages_phone_or_email_check
    check (
      nullif(btrim(phone), '') is not null
      or nullif(btrim(email), '') is not null
    )
);

create index if not exists idx_contact_messages_status_created
  on public.contact_messages(status, created_at desc);

-- Keep updated_at accurate when an admin changes status or handling details.
create or replace function public.set_contact_message_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_contact_message_updated_at
  on public.contact_messages;
create trigger set_contact_message_updated_at
  before update on public.contact_messages
  for each row execute procedure public.set_contact_message_updated_at();

alter table public.contact_messages enable row level security;

/*
  Remove any pre-existing policies so a permissive legacy policy cannot combine
  with the canonical admin-only policies below.
*/
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_messages'
  loop
    execute format(
      'drop policy if exists %I on public.contact_messages',
      policy_record.policyname
    );
  end loop;
end;
$$;

-- Admins may read all submitted contact messages.
create policy "Admins can read contact messages"
  on public.contact_messages
  for select
  to authenticated
  using (public.is_admin());

-- Admins may update message status and handling details.
create policy "Admins can update contact messages"
  on public.contact_messages
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admins may permanently delete contact messages when required.
create policy "Admins can delete contact messages"
  on public.contact_messages
  for delete
  to authenticated
  using (public.is_admin());

/*
  Table grants are deliberately narrower than the policies. There is no anon
  grant and no browser insert grant; only the server-side service role inserts.
*/
revoke all on public.contact_messages from anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;
