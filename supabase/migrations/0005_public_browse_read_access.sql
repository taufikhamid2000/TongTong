-- Public, unauthenticated browsing: a visitor should be able to see
-- neighborhoods and the routes/schedules/trip instances that serve them
-- without signing in (mirrors the "public read, sign in only to write"
-- pattern already shipped for BilikSewa). Booking a seat, running a
-- shuttle, and managing a neighborhood still require an account — those
-- stay gated by the existing `to authenticated` write policies from
-- 0001_core_schema.sql, which this migration does not touch.
--
-- The 0001 "readable by everyone" policies were actually `to authenticated`
-- only, so anon reads were silently returning zero rows. This adds sibling
-- `to anon` select policies scoped to the same read-only tables, and (for
-- tongtong_operators, which mixes a public display name with
-- contact_phone/contact_email) locks the anon grant down to non-PII
-- columns only, since RLS filters rows, not columns.
--
-- Statements are written to be safely re-run, per this project's
-- convention (see 0001_core_schema.sql header).

drop policy if exists "tongtong operators are readable by anon" on tongtong_operators;
create policy "tongtong operators are readable by anon"
  on tongtong_operators for select to anon using (true);
revoke select on tongtong_operators from anon;
grant select (id, owner_id, name, is_verified, created_at) on tongtong_operators to anon;

drop policy if exists "tongtong neighborhoods are readable by anon" on tongtong_neighborhoods;
create policy "tongtong neighborhoods are readable by anon"
  on tongtong_neighborhoods for select to anon using (true);

drop policy if exists "tongtong routes are readable by anon" on tongtong_routes;
create policy "tongtong routes are readable by anon"
  on tongtong_routes for select to anon using (true);

drop policy if exists "tongtong route stops are readable by anon" on tongtong_route_stops;
create policy "tongtong route stops are readable by anon"
  on tongtong_route_stops for select to anon using (true);

drop policy if exists "tongtong schedules are readable by anon" on tongtong_schedules;
create policy "tongtong schedules are readable by anon"
  on tongtong_schedules for select to anon using (true);

drop policy if exists "tongtong trip instances are readable by anon" on tongtong_trip_instances;
create policy "tongtong trip instances are readable by anon"
  on tongtong_trip_instances for select to anon using (true);

-- tongtong_bookings, tongtong_payments and tongtong_profiles are
-- deliberately left untouched: they carry rider PII / commitments and
-- stay authenticated-only, row-scoped to their owner as in 0001.
