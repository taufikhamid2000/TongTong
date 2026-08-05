"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySession } from "@/lib/auth/dal";
import { BookingFormSchema, BookingFormState } from "@/lib/rider/definitions";

export async function bookTrip(
  tripInstanceId: string,
  neighborhoodId: string,
  _state: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const validatedFields = BookingFormSchema.safeParse({
    tripInstanceId,
    neighborhoodId,
    seatCount: formData.get("seatCount"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const session = await verifySession();
  const supabase = await createClient();
  const { seatCount } = validatedFields.data;

  const { data: trip } = await supabase
    .from("tongtong_trip_instances")
    .select("id, status, max_riders, booking_cutoff_at, tongtong_bookings(seat_count, status)")
    .eq("id", tripInstanceId)
    .maybeSingle();

  if (!trip) {
    return { message: "This trip no longer exists." };
  }
  if (trip.status !== "open") {
    return { message: "Booking has already closed for this trip." };
  }
  if (new Date(trip.booking_cutoff_at) <= new Date()) {
    return { message: "Booking has already closed for this trip." };
  }

  const existingBookings =
    (trip as unknown as { tongtong_bookings: { seat_count: number; status: string }[] })
      .tongtong_bookings ?? [];
  const bookedSeats = existingBookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.seat_count, 0);

  if (bookedSeats + seatCount > trip.max_riders) {
    return { message: `Only ${trip.max_riders - bookedSeats} seat(s) left on this trip.` };
  }

  const { error } = await supabase.from("tongtong_bookings").insert({
    trip_instance_id: tripInstanceId,
    rider_id: session.userId,
    neighborhood_id: neighborhoodId,
    seat_count: seatCount,
  });

  if (error) {
    return {
      message:
        error.code === "23505" ? "You've already booked a seat on this trip." : error.message,
    };
  }

  revalidatePath(`/rider/neighborhood/${neighborhoodId}`);
  revalidatePath("/rider/bookings");
  return undefined;
}

export async function cancelBooking(bookingId: string) {
  const session = await verifySession();
  const supabase = await createClient();

  await supabase
    .from("tongtong_bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("rider_id", session.userId);

  revalidatePath("/rider/bookings");
}

// Mock payment: no real money moves. tongtong_payments has no write
// policy for authenticated users (see 0001_core_schema.sql) — writes
// only happen here, server-side, via the admin client, after this
// action has independently confirmed the payment's booking belongs to
// the signed-in rider using their own session-scoped client (so RLS,
// not trust, is what proves ownership before the privileged write).
export async function markPaymentPaid(paymentId: string) {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("tongtong_payments")
    .select("id, status, tongtong_bookings(rider_id)")
    .eq("id", paymentId)
    .maybeSingle();

  const booking = (
    payment as unknown as { tongtong_bookings: { rider_id: string } | null } | null
  )?.tongtong_bookings;

  if (!payment || booking?.rider_id !== session.userId) {
    return;
  }
  if (payment.status !== "pending") {
    return;
  }

  const admin = createAdminClient();
  await admin
    .from("tongtong_payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", paymentId);

  revalidatePath("/rider/bookings");
}
