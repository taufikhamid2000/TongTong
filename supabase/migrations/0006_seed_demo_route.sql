-- Seed one demo neighborhood + operator + route + schedule + upcoming
-- trips so the public /rider browse page (and its portfolio screenshot)
-- has something real to show instead of "No neighborhoods are registered
-- yet." Owned by the existing e2e-smoke test profile, not a real person.
-- Trip dates are computed relative to now() so this never goes stale.
do $$
declare
  demo_owner uuid := '079c8a6b-d191-490f-9e91-8f3f0f18f5d7'; -- e2e-smoke@yourdomain.com
  v_neighborhood uuid;
  v_operator uuid;
  v_route uuid;
  v_schedule uuid;
begin
  if exists (select 1 from tongtong_neighborhoods where name = 'Pelangi Damansara') then
    return;
  end if;

  insert into tongtong_neighborhoods (admin_id, name, address, lat, lng, is_verified)
  values (demo_owner, 'Pelangi Damansara', 'Jalan PJU 6A, Petaling Jaya, Selangor', 3.1390, 101.6120, true)
  returning id into v_neighborhood;

  insert into tongtong_operators (owner_id, name, contact_phone, contact_email, is_verified)
  values (demo_owner, 'RapidLink Shuttle', '+60312345678', 'ops@rapidlink.example', true)
  returning id into v_operator;

  -- route.name is combined with destination_name as "name → destination"
  -- by app/rider/neighborhood/[neighborhoodId]/page.tsx, so this must be
  -- just the route's own short name, not include the destination itself.
  insert into tongtong_routes (operator_id, name, destination_name, destination_lat, destination_lng, status)
  values (v_operator, 'Pelangi Damansara Shuttle', 'Kelana Jaya LRT Station', 3.1073, 101.5952, 'active')
  returning id into v_route;

  insert into tongtong_route_stops (route_id, neighborhood_id, stop_order, pickup_note)
  values (v_route, v_neighborhood, 1, 'Main guardhouse, Block A side');

  insert into tongtong_schedules (route_id, days_of_week, departure_time, booking_cutoff_minutes, is_active)
  values (v_route, array[1,2,3,4,5]::smallint[], time '07:30', 60, true)
  returning id into v_schedule;

  -- Next 5 weekday mornings, each still open for booking.
  insert into tongtong_trip_instances
    (route_id, schedule_id, service_date, departure_at, booking_cutoff_at, status, total_cost, min_riders, max_riders)
  select
    v_route,
    v_schedule,
    d::date,
    (d + time '07:30') at time zone 'Asia/Kuala_Lumpur',
    (d + time '06:30') at time zone 'Asia/Kuala_Lumpur',
    'open',
    45.00,
    3,
    12
  from generate_series(current_date + 1, current_date + 9, interval '1 day') as d
  where extract(isodow from d) between 1 and 5
  limit 5;
end $$;
