-- Mock payments: no real money moves yet. When a trip locks, every
-- confirmed booking gets a 'pending' tongtong_payments row for its
-- price_charged. Riders self-report payment via a Server Action (using
-- the service-role client after verifying booking ownership — see
-- lib/rider/actions.ts) rather than through an RLS write policy, so
-- tongtong_payments stays locked down to service-role writes only, as
-- originally documented in 0001_core_schema.sql.
create or replace function public.tongtong_lock_due_trips()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  trip record;
  seats integer;
  ppr numeric(10, 2);
begin
  for trip in
    select * from tongtong_trip_instances
    where status = 'open' and booking_cutoff_at <= now()
    for update skip locked
  loop
    select coalesce(sum(seat_count), 0) into seats
    from tongtong_bookings
    where trip_instance_id = trip.id and status <> 'cancelled';

    if seats >= trip.min_riders then
      ppr := round(trip.total_cost / seats, 2);

      update tongtong_trip_instances
      set status = 'locked', price_per_rider = ppr, final_rider_count = seats
      where id = trip.id;

      update tongtong_bookings
      set status = 'confirmed', price_charged = round(ppr * seat_count, 2)
      where trip_instance_id = trip.id and status <> 'cancelled';

      insert into tongtong_payments (booking_id, amount, status)
      select b.id, b.price_charged, 'pending'
      from tongtong_bookings b
      where b.trip_instance_id = trip.id and b.status = 'confirmed';
    else
      update tongtong_trip_instances set status = 'cancelled' where id = trip.id;

      update tongtong_bookings
      set status = 'cancelled'
      where trip_instance_id = trip.id and status <> 'cancelled';
    end if;
  end loop;
end;
$$;
