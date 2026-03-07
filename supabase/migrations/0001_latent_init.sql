create extension if not exists "pgcrypto";

create type public.card_status as enum ('active', 'developable', 'developed');
create type public.card_member_role as enum ('creator', 'contributor');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  display_name text,
  preferred_locale text not null default 'en'
);

create table if not exists public.inventory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cards_remaining integer not null default 0,
  starter_granted_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shared boolean not null default false,
  frame_limit integer not null default 24 check (frame_limit = 24),
  frame_count integer not null default 0,
  status public.card_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint frame_count_in_bounds check (frame_count between 0 and frame_limit)
);

create table if not exists public.card_members (
  card_id uuid not null references public.cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.card_member_role not null,
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (card_id, user_id)
);

create table if not exists public.card_frames (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  frame_index integer not null,
  captured_by uuid not null references auth.users(id) on delete cascade,
  lens_id text not null,
  master_uri text not null,
  derivative_uri text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (card_id, frame_index)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lens_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lens_id text not null,
  source_product_id text not null,
  transaction_id text not null,
  purchased_at timestamptz not null default timezone('utc', now()),
  unique (user_id, lens_id),
  unique (transaction_id)
);

create table if not exists public.purchase_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id text not null,
  product_id text not null,
  applied boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, transaction_id)
);

create index if not exists idx_cards_owner on public.cards (owner_id);
create index if not exists idx_card_members_user on public.card_members (user_id);
create index if not exists idx_card_frames_card on public.card_frames (card_id, frame_index);
create index if not exists idx_invites_code on public.invites (code);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.ensure_starter_inventory(p_user_id uuid)
returns public.inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inventory public.inventory;
begin
  insert into public.inventory (user_id, cards_remaining, starter_granted_at)
  values (p_user_id, 3, timezone('utc', now()))
  on conflict (user_id) do nothing;

  select * into v_inventory from public.inventory where user_id = p_user_id;
  return v_inventory;
end;
$$;

create or replace function public.is_card_member(p_card_id uuid, p_user_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.card_members m
    where m.card_id = p_card_id and m.user_id = p_user_id
  );
$$;

create or replace function public.create_card(p_user_id uuid, p_shared boolean default false)
returns public.cards
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card public.cards;
begin
  perform public.ensure_starter_inventory(p_user_id);

  insert into public.cards (owner_id, shared)
  values (p_user_id, p_shared)
  returning * into v_card;

  insert into public.card_members (card_id, user_id, role)
  values (v_card.id, p_user_id, 'creator');

  return v_card;
end;
$$;

create or replace function public.create_invite(p_card_id uuid, p_user_id uuid)
returns public.invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card public.cards;
  v_invite public.invites;
  v_code text;
begin
  select * into v_card from public.cards where id = p_card_id;
  if v_card.id is null then
    raise exception 'Card not found';
  end if;

  if v_card.shared is false then
    raise exception 'Invites are only available for shared cards';
  end if;

  if v_card.owner_id <> p_user_id then
    raise exception 'Only creator can create invites';
  end if;

  v_code := upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 6));

  insert into public.invites (card_id, code, created_by, expires_at)
  values (p_card_id, v_code, p_user_id, timezone('utc', now()) + interval '72 hours')
  returning * into v_invite;

  return v_invite;
end;
$$;

create or replace function public.join_card(p_code text, p_user_id uuid)
returns public.cards
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_card public.cards;
  v_member_count integer;
begin
  select * into v_invite
  from public.invites
  where code = upper(trim(p_code));

  if v_invite.id is null then
    raise exception 'Invalid invite code';
  end if;

  if v_invite.expires_at < timezone('utc', now()) then
    raise exception 'Invite expired';
  end if;

  select * into v_card from public.cards where id = v_invite.card_id;

  if exists (
    select 1 from public.card_members
    where card_id = v_card.id and user_id = p_user_id
  ) then
    return v_card;
  end if;

  select count(*) into v_member_count from public.card_members where card_id = v_card.id;
  if v_member_count >= 6 then
    raise exception 'Shared card participant limit reached';
  end if;

  insert into public.card_members (card_id, user_id, role)
  values (v_card.id, p_user_id, 'contributor');

  return v_card;
end;
$$;

create or replace function public.capture_frame(
  p_card_id uuid,
  p_user_id uuid,
  p_lens_id text,
  p_master_uri text,
  p_derivative_uri text default null
)
returns public.card_frames
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card public.cards;
  v_frame public.card_frames;
  v_next_index integer;
  v_creator_inventory integer;
begin
  select * into v_card
  from public.cards
  where id = p_card_id
  for update;

  if v_card.id is null then
    raise exception 'Card not found';
  end if;

  if not public.is_card_member(v_card.id, p_user_id) then
    raise exception 'Not a card member';
  end if;

  if v_card.status <> 'active' then
    raise exception 'Card is not active';
  end if;

  if v_card.frame_count = 0 then
    perform public.ensure_starter_inventory(v_card.owner_id);

    select cards_remaining into v_creator_inventory
    from public.inventory
    where user_id = v_card.owner_id
    for update;

    if v_creator_inventory <= 0 then
      raise exception 'Creator has no remaining cards';
    end if;

    update public.inventory
    set cards_remaining = cards_remaining - 1,
        updated_at = timezone('utc', now())
    where user_id = v_card.owner_id;
  end if;

  v_next_index := v_card.frame_count + 1;
  if v_next_index > v_card.frame_limit then
    raise exception 'Card is full';
  end if;

  insert into public.card_frames (card_id, frame_index, captured_by, lens_id, master_uri, derivative_uri)
  values (v_card.id, v_next_index, p_user_id, p_lens_id, p_master_uri, p_derivative_uri)
  returning * into v_frame;

  update public.cards
  set frame_count = v_next_index,
      status = case when v_next_index = frame_limit then 'developable'::public.card_status else 'active'::public.card_status end,
      updated_at = timezone('utc', now())
  where id = v_card.id;

  return v_frame;
end;
$$;

create or replace function public.develop_card(p_card_id uuid, p_user_id uuid)
returns public.cards
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card public.cards;
begin
  select * into v_card
  from public.cards
  where id = p_card_id
  for update;

  if v_card.id is null then
    raise exception 'Card not found';
  end if;

  if not public.is_card_member(v_card.id, p_user_id) then
    raise exception 'Not a card member';
  end if;

  if v_card.status <> 'developable' or v_card.frame_count <> v_card.frame_limit then
    raise exception 'Card is not ready to develop';
  end if;

  update public.cards
  set status = 'developed',
      updated_at = timezone('utc', now())
  where id = v_card.id
  returning * into v_card;

  return v_card;
end;
$$;

create or replace function public.apply_purchase(
  p_user_id uuid,
  p_product_id text,
  p_transaction_id text
)
returns table(applied boolean, cards_remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_already_applied boolean;
begin
  perform public.ensure_starter_inventory(p_user_id);

  select exists(
    select 1
    from public.purchase_events
    where user_id = p_user_id and transaction_id = p_transaction_id
  ) into v_already_applied;

  if v_already_applied then
    return query
    select false, i.cards_remaining
    from public.inventory i
    where i.user_id = p_user_id;
    return;
  end if;

  insert into public.purchase_events (user_id, transaction_id, product_id, applied)
  values (p_user_id, p_transaction_id, p_product_id, true);

  if p_product_id = 'card_1_059' then
    update public.inventory
    set cards_remaining = cards_remaining + 1,
        updated_at = timezone('utc', now())
    where user_id = p_user_id;
  end if;

  return query
  select true, i.cards_remaining
  from public.inventory i
  where i.user_id = p_user_id;
end;
$$;

create trigger cards_touch_updated_at
before update on public.cards
for each row execute function public.touch_updated_at();

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger inventory_touch_updated_at
before update on public.inventory
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.inventory enable row level security;
alter table public.cards enable row level security;
alter table public.card_members enable row level security;
alter table public.card_frames enable row level security;
alter table public.invites enable row level security;
alter table public.lens_entitlements enable row level security;
alter table public.purchase_events enable row level security;

create policy "profiles_self"
on public.profiles
for all
using (id = auth.uid())
with check (id = auth.uid());

create policy "inventory_self"
on public.inventory
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "cards_member_read"
on public.cards
for select
using (public.is_card_member(id, auth.uid()));

create policy "cards_owner_insert"
on public.cards
for insert
with check (owner_id = auth.uid());

create policy "cards_owner_update"
on public.cards
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "card_members_member_read"
on public.card_members
for select
using (
  exists (
    select 1 from public.card_members cm
    where cm.card_id = card_members.card_id and cm.user_id = auth.uid()
  )
);

create policy "card_members_self_insert"
on public.card_members
for insert
with check (user_id = auth.uid());

create policy "card_frames_member_read"
on public.card_frames
for select
using (public.is_card_member(card_id, auth.uid()));

create policy "card_frames_member_insert"
on public.card_frames
for insert
with check (captured_by = auth.uid() and public.is_card_member(card_id, auth.uid()));

create policy "invites_member_read"
on public.invites
for select
using (public.is_card_member(card_id, auth.uid()));

create policy "invites_creator_insert"
on public.invites
for insert
with check (created_by = auth.uid());

create policy "lens_entitlements_self"
on public.lens_entitlements
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "purchase_events_self"
on public.purchase_events
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
