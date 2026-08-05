-- TongTong core schema: operators, neighborhoods, routes, schedules,
-- trip instances, bookings. Pricing model is "locked at cutoff": each
-- trip_instance carries a total_cost + booking_cutoff_at; price_per_rider
-- is only computed once, when the cutoff closes (see trip status
-- transition to 'locked'/'confirmed' in application logic, not a trigger,
-- so refund/cancellation edge cases stay in app code rather than SQL).
--
-- master_db is shared across several apps (duitduit, nogipin, an EF-Core
-- shuttle app, ...), so every object here is tongtong_-prefixed to avoid
-- name collisions, and every statement is written to be safely re-run
-- (this project applies migrations with `supabase db query -f`, not
-- `db push`, since db push/migration repair touch shared history state).

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums (guarded: CREATE TYPE has no IF NOT EXISTS)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tongtong_route_status') then
    create type tongtong_route_status as enum ('draft', 'active', 'paused', 'retired');
  end if;
  if not exists (select 1 from pg_type where typname = 'tongtong_trip_status') then
    create type tongtong_trip_status as enum ('open', 'locked', 'cancelled', 'completed');
  end if;
  if not exists (select 1 from pg_type where typname = 'tongtong_booking_status') then
    create type tongtong_booking_status as enum ('pending', 'confirmed', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'tongtong_payment_status') then
    create type tongtong_payment_status as enum ('pending', 'paid', 'refunded', 'failed');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table if not exists tongtong_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- A single person can be a rider, an operator owner, and a neighborhood
-- admin at once, so those roles are separate ownership tables below
-- rather than a role column on tongtong_profiles.

-- ---------------------------------------------------------------------
-- Operators (bus/van companies)
-- ---------------------------------------------------------------------
create table if not exists tongtong_operators (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references tongtong_profiles (id) on delete cascade,
  name text not null,
  contact_phone text,
  contact_email text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists tongtong_operators_owner_id_idx on tongtong_operators (owner_id);

-- ---------------------------------------------------------------------
-- Neighborhoods (condos/pickup points, registered by an admin)
-- ---------------------------------------------------------------------
create table if not exists tongtong_neighborhoods (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references tongtong_profiles (id) on delete cascade,
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists tongtong_neighborhoods_admin_id_idx on tongtong_neighborhoods (admin_id);

-- ---------------------------------------------------------------------
-- Routes (operator-defined: neighborhoods -> a station)
-- ---------------------------------------------------------------------
create table if not exists tongtong_routes (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references tongtong_operators (id) on delete cascade,
  name text not null,
  destination_name text not null,
  destination_lat double precision not null,
  destination_lng double precision not null,
  status tongtong_route_status not null default 'draft',
  created_at timestamptz not null default now()
);

create index if not exists tongtong_routes_operator_id_idx on tongtong_routes (operator_id);

-- Ordered pickup stops along a route, each tied to a registered
-- neighborhood. stop_order defines pickup sequence.
create table if not exists tongtong_route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references tongtong_routes (id) on delete cascade,
  neighborhood_id uuid not null references tongtong_neighborhoods (id) on delete cascade,
  stop_order smallint not null,
  pickup_note text,
  unique (route_id, neighborhood_id),
  unique (route_id, stop_order)
);

create index if not exists tongtong_route_stops_route_id_idx on tongtong_route_stops (route_id);
create index if not exists tongtong_route_stops_neighborhood_id_idx on tongtong_route_stops (neighborhood_id);

-- ---------------------------------------------------------------------
-- Schedules (recurrence rule for a route)
-- ---------------------------------------------------------------------
create table if not exists tongtong_schedules (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references tongtong_routes (id) on delete cascade,
  -- 0=Sunday .. 6=Saturday, Postgres int[] so a schedule can repeat on
  -- multiple weekdays (e.g. {1,2,3,4,5} for weekdays).
  days_of_week smallint[] not null,
  departure_time time not null,
  -- how long before departure_at booking closes and price locks
  booking_cutoff_minutes integer not null default 60,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists tongtong_schedules_route_id_idx on tongtong_schedules (route_id);

-- ---------------------------------------------------------------------
-- Trip instances (one concrete, bookable run of a schedule/route)
-- ---------------------------------------------------------------------
create table if not exists tongtong_trip_instances (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references tongtong_routes (id) on delete cascade,
  schedule_id uuid references tongtong_schedules (id) on delete set null,
  service_date date not null,
  departure_at timestamptz not null,
  booking_cutoff_at timestamptz not null,
  status tongtong_trip_status not null default 'open',

  -- pricing: operator sets total cost (and an optional floor so a trip
  -- won't run at a loss); price_per_rider is written once at cutoff.
  total_cost numeric(10, 2) not null check (total_cost > 0),
  min_riders smallint not null default 1 check (min_riders > 0),
  max_riders smallint not null check (max_riders >= min_riders),
  price_per_rider numeric(10, 2),
  final_rider_count smallint,

  created_at timestamptz not null default now(),
  unique (route_id, service_date)
);

create index if not exists tongtong_trip_instances_route_id_idx on tongtong_trip_instances (route_id);
create index if not exists tongtong_trip_instances_status_idx on tongtong_trip_instances (status);
create index if not exists tongtong_trip_instances_departure_at_idx on tongtong_trip_instances (departure_at);

-- ---------------------------------------------------------------------
-- Bookings (a rider reserving seats on a trip instance)
-- ---------------------------------------------------------------------
create table if not exists tongtong_bookings (
  id uuid primary key default gen_random_uuid(),
  trip_instance_id uuid not null references tongtong_trip_instances (id) on delete cascade,
  rider_id uuid not null references tongtong_profiles (id) on delete cascade,
  neighborhood_id uuid not null references tongtong_neighborhoods (id),
  seat_count smallint not null default 1 check (seat_count > 0),
  status tongtong_booking_status not null default 'pending',
  -- filled in once the trip locks: seat_count * price_per_rider at lock time
  price_charged numeric(10, 2),
  created_at timestamptz not null default now(),
  unique (trip_instance_id, rider_id)
);

create index if not exists tongtong_bookings_trip_instance_id_idx on tongtong_bookings (trip_instance_id);
create index if not exists tongtong_bookings_rider_id_idx on tongtong_bookings (rider_id);
create index if not exists tongtong_bookings_neighborhood_id_idx on tongtong_bookings (neighborhood_id);

-- ---------------------------------------------------------------------
-- Payments (charge against a locked booking)
-- ---------------------------------------------------------------------
create table if not exists tongtong_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references tongtong_bookings (id) on delete cascade,
  amount numeric(10, 2) not null check (amount >= 0),
  status tongtong_payment_status not null default 'pending',
  provider_ref text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tongtong_payments_booking_id_idx on tongtong_payments (booking_id);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table tongtong_profiles enable row level security;
alter table tongtong_operators enable row level security;
alter table tongtong_neighborhoods enable row level security;
alter table tongtong_routes enable row level security;
alter table tongtong_route_stops enable row level security;
alter table tongtong_schedules enable row level security;
alter table tongtong_trip_instances enable row level security;
alter table tongtong_bookings enable row level security;
alter table tongtong_payments enable row level security;

-- Policies: DROP + CREATE (Postgres has no CREATE POLICY IF NOT EXISTS)
-- so this migration can be safely re-run.

drop policy if exists "tongtong profiles are readable by authenticated users" on tongtong_profiles;
create policy "tongtong profiles are readable by authenticated users"
  on tongtong_profiles for select to authenticated using (true);
drop policy if exists "tongtong users manage their own profile" on tongtong_profiles;
create policy "tongtong users manage their own profile"
  on tongtong_profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "tongtong operators are readable by everyone" on tongtong_operators;
create policy "tongtong operators are readable by everyone"
  on tongtong_operators for select to authenticated using (true);
drop policy if exists "tongtong owners manage their own operator" on tongtong_operators;
create policy "tongtong owners manage their own operator"
  on tongtong_operators for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "tongtong neighborhoods are readable by everyone" on tongtong_neighborhoods;
create policy "tongtong neighborhoods are readable by everyone"
  on tongtong_neighborhoods for select to authenticated using (true);
drop policy if exists "tongtong admins manage their own neighborhood" on tongtong_neighborhoods;
create policy "tongtong admins manage their own neighborhood"
  on tongtong_neighborhoods for all to authenticated using (admin_id = auth.uid()) with check (admin_id = auth.uid());

drop policy if exists "tongtong routes are readable by everyone" on tongtong_routes;
create policy "tongtong routes are readable by everyone"
  on tongtong_routes for select to authenticated using (true);
drop policy if exists "tongtong operator owners manage their routes" on tongtong_routes;
create policy "tongtong operator owners manage their routes"
  on tongtong_routes for all to authenticated using (
    exists (select 1 from tongtong_operators o where o.id = tongtong_routes.operator_id and o.owner_id = auth.uid())
  ) with check (
    exists (select 1 from tongtong_operators o where o.id = tongtong_routes.operator_id and o.owner_id = auth.uid())
  );

drop policy if exists "tongtong route stops are readable by everyone" on tongtong_route_stops;
create policy "tongtong route stops are readable by everyone"
  on tongtong_route_stops for select to authenticated using (true);
drop policy if exists "tongtong operator owners manage stops on their routes" on tongtong_route_stops;
create policy "tongtong operator owners manage stops on their routes"
  on tongtong_route_stops for all to authenticated using (
    exists (
      select 1 from tongtong_routes r
      join tongtong_operators o on o.id = r.operator_id
      where r.id = tongtong_route_stops.route_id and o.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from tongtong_routes r
      join tongtong_operators o on o.id = r.operator_id
      where r.id = tongtong_route_stops.route_id and o.owner_id = auth.uid()
    )
  );

drop policy if exists "tongtong schedules are readable by everyone" on tongtong_schedules;
create policy "tongtong schedules are readable by everyone"
  on tongtong_schedules for select to authenticated using (true);
drop policy if exists "tongtong operator owners manage schedules on their routes" on tongtong_schedules;
create policy "tongtong operator owners manage schedules on their routes"
  on tongtong_schedules for all to authenticated using (
    exists (
      select 1 from tongtong_routes r
      join tongtong_operators o on o.id = r.operator_id
      where r.id = tongtong_schedules.route_id and o.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from tongtong_routes r
      join tongtong_operators o on o.id = r.operator_id
      where r.id = tongtong_schedules.route_id and o.owner_id = auth.uid()
    )
  );

drop policy if exists "tongtong trip instances are readable by everyone" on tongtong_trip_instances;
create policy "tongtong trip instances are readable by everyone"
  on tongtong_trip_instances for select to authenticated using (true);
drop policy if exists "tongtong operator owners manage their trip instances" on tongtong_trip_instances;
create policy "tongtong operator owners manage their trip instances"
  on tongtong_trip_instances for all to authenticated using (
    exists (
      select 1 from tongtong_routes r
      join tongtong_operators o on o.id = r.operator_id
      where r.id = tongtong_trip_instances.route_id and o.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from tongtong_routes r
      join tongtong_operators o on o.id = r.operator_id
      where r.id = tongtong_trip_instances.route_id and o.owner_id = auth.uid()
    )
  );

drop policy if exists "tongtong riders manage their own bookings" on tongtong_bookings;
create policy "tongtong riders manage their own bookings"
  on tongtong_bookings for all to authenticated using (rider_id = auth.uid()) with check (rider_id = auth.uid());
drop policy if exists "tongtong operator owners read bookings on their trips" on tongtong_bookings;
create policy "tongtong operator owners read bookings on their trips"
  on tongtong_bookings for select to authenticated using (
    exists (
      select 1 from tongtong_trip_instances ti
      join tongtong_routes r on r.id = ti.route_id
      join tongtong_operators o on o.id = r.operator_id
      where ti.id = tongtong_bookings.trip_instance_id and o.owner_id = auth.uid()
    )
  );

drop policy if exists "tongtong riders read payments on their own bookings" on tongtong_payments;
create policy "tongtong riders read payments on their own bookings"
  on tongtong_payments for select to authenticated using (
    exists (
      select 1 from tongtong_bookings b where b.id = tongtong_payments.booking_id and b.rider_id = auth.uid()
    )
  );
