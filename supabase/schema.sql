-- Vrooma Supabase schema. Run in the Supabase SQL editor (or supabase db push).
-- Roles: super_admin, admin, dealer_owner, agent, seller, inspector, customer.
-- Row level security is enabled on every table.

create extension if not exists "pgcrypto";

create type user_role as enum ('super_admin','admin','dealer_owner','agent','seller','inspector','customer');
create type vehicle_status as enum ('pending','active','paused','sold','rejected','expired');
create type listing_tier as enum ('free','premium','featured');
create type lead_status as enum ('new','contacted','interested','inspection','negotiation','deposit','sold','lost');
create type pay_method as enum ('qpay','socialpay','bank','cash');
create type pay_status as enum ('pending','paid','rejected','refunded');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null, phone text, role user_role not null default 'customer',
  province text, verified boolean not null default false, banned boolean not null default false,
  dealer_id uuid, bio text, prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table dealers (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text, phone text, email text, website text, logo_url text,
  owner_id uuid references profiles(id), verified boolean not null default false,
  plan text not null default 'none', plan_expires timestamptz, locations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table profiles add constraint profiles_dealer_fk foreign key (dealer_id) references dealers(id) on delete set null;

create table brands (id text primary key, name text not null unique, country text);
create table categories (id text primary key, name_mn text not null, name_en text not null);
create table models (
  id text primary key, brand_id text not null references brands(id), name text not null,
  body text, category_id text references categories(id), specs jsonb not null default '{}'::jsonb
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  brand_id text not null references brands(id), model_id text references models(id), model_name text not null,
  category_id text references categories(id), body text,
  year int not null, import_year int, mileage int not null, cc int, fuel text, trans text, drive text,
  steering text check (steering in ('LHD','RHD')), color text, doors int, seats int, condition text,
  accident text default 'none', accident_note text, origin text default 'imported', owners int default 1,
  customs_cleared boolean default false, plate text,
  province text, district text, lat double precision, lng double precision,
  price bigint not null check (price >= 0), negotiable boolean default false, prev_price bigint,
  desc_mn text, desc_en text, specs jsonb not null default '{}'::jsonb,
  seller_id uuid not null references profiles(id), dealer_id uuid references dealers(id),
  status vehicle_status not null default 'pending', tier listing_tier not null default 'free',
  featured_until timestamptz, premium_until timestamptz, expires_at timestamptz,
  sold_at timestamptz, sold_price bigint, reject_reason text,
  views int not null default 0, phone_clicks int not null default 0, report_id uuid,
  photos jsonb not null default '[]'::jsonb, video_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on vehicles (status, brand_id, year, price);
create index on vehicles (seller_id);
create index on vehicles (dealer_id);

create table leads (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  customer_id uuid references profiles(id), name text not null, phone text not null, email text, message text,
  source text default 'website', status lead_status not null default 'new', assigned_to uuid references profiles(id),
  offer bigint, notes jsonb not null default '[]'::jsonb, reminders jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade, lead_id uuid references leads(id),
  customer_id uuid references profiles(id), inspector_id uuid references profiles(id),
  at timestamptz not null, place text, status text not null default 'requested', note text, report_id uuid,
  requested_by uuid references profiles(id), created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade, appointment_id uuid references appointments(id),
  inspector_id uuid not null references profiles(id), odometer int, checks jsonb not null default '{}'::jsonb,
  accident_found boolean default false, accident_note text, maintenance text, notes text, photos jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','published')), created_at timestamptz not null default now()
);

create table threads (id uuid primary key default gen_random_uuid(), vehicle_id uuid references vehicles(id), created_at timestamptz not null default now());
create table thread_members (thread_id uuid references threads(id) on delete cascade, user_id uuid references profiles(id) on delete cascade, primary key (thread_id, user_id));
create table messages (id uuid primary key default gen_random_uuid(), thread_id uuid not null references threads(id) on delete cascade, sender_id uuid not null references profiles(id), body text not null, created_at timestamptz not null default now());

create table notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade, kind text, title text, body text, href text, read boolean not null default false, dedupe_key text, created_at timestamptz not null default now(), unique (user_id, dedupe_key));
create table favorites (user_id uuid references profiles(id) on delete cascade, vehicle_id uuid references vehicles(id) on delete cascade, created_at timestamptz not null default now(), primary key (user_id, vehicle_id));
create table saved_searches (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade, name text not null, query text not null, notify boolean not null default true, created_at timestamptz not null default now());

create table packages (id text primary key, name text not null, kind text not null, days int not null, price bigint not null);
create table payments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id), vehicle_id uuid references vehicles(id),
  package_id text references packages(id), amount bigint not null, discount bigint not null default 0, method pay_method not null,
  status pay_status not null default 'pending', reference text, created_at timestamptz not null default now()
);
create table ads (id uuid primary key default gen_random_uuid(), slot text not null, title text, image_url text, href text, starts_at timestamptz, ends_at timestamptz, active boolean not null default true, clicks int not null default 0, impressions int not null default 0);
create table campaigns (id uuid primary key default gen_random_uuid(), code text unique not null, percent int not null check (percent between 1 and 100), starts_at timestamptz, ends_at timestamptz, active boolean not null default true);
create table flags (id uuid primary key default gen_random_uuid(), vehicle_id uuid references vehicles(id) on delete cascade, user_id uuid references profiles(id), reason text, resolved boolean not null default false, created_at timestamptz not null default now());
create table articles (id text primary key, title_mn text, title_en text, body_mn text, body_en text, published_at timestamptz default now());
create table audit_logs (id bigint generated always as identity primary key, actor_id uuid references profiles(id), action text not null, entity text, entity_id text, detail text, created_at timestamptz not null default now());

-- helpers
create or replace function public.role_of(uid uuid) returns user_role language sql stable security definer set search_path = public as $$ select role from profiles where id = uid $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select coalesce(role_of(auth.uid()) in ('admin','super_admin'), false) $$;
create or replace function public.my_dealer() returns uuid language sql stable security definer set search_path = public as $$ select dealer_id from profiles where id = auth.uid() $$;

-- auto create profile on sign up (role is always customer or seller, never privileged)
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, phone, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'phone',
          case when new.raw_user_meta_data->>'role' = 'seller' then 'seller'::user_role else 'customer'::user_role end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- enable RLS everywhere
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop execute format('alter table %I enable row level security', t); end loop;
end $$;

-- public catalogue
create policy "catalog read" on brands for select using (true);
create policy "catalog read" on categories for select using (true);
create policy "catalog read" on models for select using (true);
create policy "packages read" on packages for select using (true);
create policy "articles read" on articles for select using (true);
create policy "catalog admin" on brands for all using (is_admin()) with check (is_admin());
create policy "catalog admin" on categories for all using (is_admin()) with check (is_admin());
create policy "catalog admin" on models for all using (is_admin()) with check (is_admin());
create policy "articles admin" on articles for all using (is_admin()) with check (is_admin());
create policy "packages admin" on packages for all using (is_admin()) with check (is_admin());

-- profiles
create policy "profile self or admin read" on profiles for select using (id = auth.uid() or is_admin() or dealer_id = my_dealer() and dealer_id is not null);
create policy "profile public sellers" on profiles for select using (role in ('seller','dealer_owner','agent'));
create policy "profile self update" on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = role_of(auth.uid()));
create policy "profile admin update" on profiles for update using (is_admin());
create policy "profile super admin roles" on profiles for update using (role_of(auth.uid()) = 'super_admin');

-- dealers
create policy "dealers read" on dealers for select using (true);
create policy "dealer owner write" on dealers for update using (owner_id = auth.uid() or is_admin());
create policy "dealer admin insert" on dealers for insert with check (is_admin());

-- vehicles: public sees active only; owners and dealer staff see their own; admins see all
create policy "vehicles public" on vehicles for select using (status in ('active','sold') or seller_id = auth.uid() or dealer_id = my_dealer() and dealer_id is not null or is_admin());
create policy "vehicles insert" on vehicles for insert with check (seller_id = auth.uid() and role_of(auth.uid()) in ('seller','dealer_owner','agent','admin','super_admin') and status = 'pending');
create policy "vehicles update own" on vehicles for update using (seller_id = auth.uid() or dealer_id = my_dealer() and dealer_id is not null or is_admin());
create policy "vehicles delete own" on vehicles for delete using (seller_id = auth.uid() or is_admin());

-- leads (CRM)
create policy "leads staff read" on leads for select using (
  is_admin() or assigned_to = auth.uid() or customer_id = auth.uid()
  or exists (select 1 from vehicles v where v.id = leads.vehicle_id and (v.seller_id = auth.uid() or (v.dealer_id = my_dealer() and role_of(auth.uid()) = 'dealer_owner'))));
create policy "leads anyone insert" on leads for insert with check (true);
create policy "leads staff update" on leads for update using (
  is_admin() or assigned_to = auth.uid()
  or exists (select 1 from vehicles v where v.id = leads.vehicle_id and (v.seller_id = auth.uid() or (v.dealer_id = my_dealer() and role_of(auth.uid()) = 'dealer_owner'))));

-- appointments and reports
create policy "appt read" on appointments for select using (is_admin() or customer_id = auth.uid() or inspector_id = auth.uid() or requested_by = auth.uid() or role_of(auth.uid()) = 'inspector'
  or exists (select 1 from vehicles v where v.id = appointments.vehicle_id and (v.seller_id = auth.uid() or v.dealer_id = my_dealer())));
create policy "appt insert" on appointments for insert with check (auth.uid() is not null);
create policy "appt update" on appointments for update using (is_admin() or inspector_id = auth.uid() or role_of(auth.uid()) = 'inspector' or requested_by = auth.uid());
create policy "reports public published" on reports for select using (status = 'published' or inspector_id = auth.uid() or is_admin());
create policy "reports inspector write" on reports for all using (inspector_id = auth.uid() or is_admin()) with check (inspector_id = auth.uid() or is_admin());

-- messaging
create policy "threads member" on threads for select using (exists (select 1 from thread_members m where m.thread_id = threads.id and m.user_id = auth.uid()));
create policy "threads insert" on threads for insert with check (auth.uid() is not null);
create policy "members read" on thread_members for select using (user_id = auth.uid() or exists (select 1 from thread_members m where m.thread_id = thread_members.thread_id and m.user_id = auth.uid()));
create policy "members insert" on thread_members for insert with check (auth.uid() is not null);
create policy "messages member read" on messages for select using (exists (select 1 from thread_members m where m.thread_id = messages.thread_id and m.user_id = auth.uid()));
create policy "messages member write" on messages for insert with check (sender_id = auth.uid() and exists (select 1 from thread_members m where m.thread_id = messages.thread_id and m.user_id = auth.uid()));

-- personal data
create policy "notifications own" on notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "favorites own" on favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "saved searches own" on saved_searches for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- money and promotion
create policy "payments own or admin read" on payments for select using (user_id = auth.uid() or is_admin());
create policy "payments own insert" on payments for insert with check (user_id = auth.uid() and status = 'pending');
create policy "payments admin update" on payments for update using (is_admin());
create policy "ads read" on ads for select using (active or is_admin());
create policy "ads admin" on ads for all using (is_admin()) with check (is_admin());
create policy "campaigns read" on campaigns for select using (true);
create policy "campaigns admin" on campaigns for all using (is_admin()) with check (is_admin());
create policy "flags insert" on flags for insert with check (auth.uid() is not null);
create policy "flags admin" on flags for select using (is_admin());
create policy "flags admin update" on flags for update using (is_admin());
create policy "audit admin read" on audit_logs for select using (is_admin());
create policy "audit insert" on audit_logs for insert with check (auth.uid() is not null);

-- storage for listing photos, dealer logos and report photos
insert into storage.buckets (id, name, public) values ('vehicle-media', 'vehicle-media', true) on conflict do nothing;
create policy "media public read" on storage.objects for select using (bucket_id = 'vehicle-media');
create policy "media owner write" on storage.objects for insert with check (bucket_id = 'vehicle-media' and auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media owner delete" on storage.objects for delete using (bucket_id = 'vehicle-media' and (storage.foldername(name))[1] = auth.uid()::text);
