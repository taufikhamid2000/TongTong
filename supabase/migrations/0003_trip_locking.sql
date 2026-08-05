-- Trip locking: the pooled-fare mechanic. Once booking_cutoff_at passes
-- on an 'open' trip, this function decides its fate exactly once:
--   - enough riders (sum of seat_count >= min_riders) -> 'locked',
--     price_per_rider = total_cost / final_rider_count, every non-cancelled
--     booking gets price_charged and flips to 'confirmed'.
--   - not enough riders -> 'cancelled', every non-cancelled booking is
--     cancelled too (no payments exist yet, so "cancel" is the full
--     refund story for now — nothing was ever charged).
--
-- Runs as a single SQL function so the read-seats + decide + write-back
-- sequence is atomic per trip; FOR UPDATE SKIP LOCKED lets concurrent
-- invocations (e.g. an overlapping cron tick) safely split the work
-- instead of racing on the same trip.
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
    else
      update tongtong_trip_instances set status = 'cancelled' where id = trip.id;

      update tongtong_bookings
      set status = 'cancelled'
      where trip_instance_id = trip.id and status <> 'cancelled';
    end if;
  end loop;
end;
$$;
