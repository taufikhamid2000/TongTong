"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";
import { getMyOperator, getOwnedRouteDetail } from "@/lib/operator/dal";
import {
  OperatorFormSchema,
  OperatorFormState,
  RouteFormSchema,
  RouteFormState,
  RouteStopFormSchema,
  RouteStopFormState,
  ScheduleFormSchema,
  ScheduleFormState,
  TripInstanceFormSchema,
  TripInstanceFormState,
} from "@/lib/operator/definitions";

export async function createOperator(
  _state: OperatorFormState,
  formData: FormData
): Promise<OperatorFormState> {
  const validatedFields = OperatorFormSchema.safeParse({
    name: formData.get("name"),
    contactPhone: formData.get("contactPhone"),
    contactEmail: formData.get("contactEmail"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const session = await verifySession();
  const supabase = await createClient();

  const { name, contactPhone, contactEmail } = validatedFields.data;
  const { error } = await supabase.from("tongtong_operators").insert({
    owner_id: session.userId,
    name,
    contact_phone: contactPhone || null,
    contact_email: contactEmail || null,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/operator");
  redirect("/operator");
}

export async function createRoute(
  _state: RouteFormState,
  formData: FormData
): Promise<RouteFormState> {
  const validatedFields = RouteFormSchema.safeParse({
    name: formData.get("name"),
    destinationName: formData.get("destinationName"),
    destinationLat: formData.get("destinationLat"),
    destinationLng: formData.get("destinationLng"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const operator = await getMyOperator();
  if (!operator) {
    return { message: "Set up your operator profile before adding a route." };
  }

  const { name, destinationName, destinationLat, destinationLng } = validatedFields.data;
  const supabase = await createClient();

  const { data: route, error } = await supabase
    .from("tongtong_routes")
    .insert({
      operator_id: operator.id,
      name,
      destination_name: destinationName,
      destination_lat: destinationLat,
      destination_lng: destinationLng,
    })
    .select("id")
    .single();

  if (error || !route) {
    return { message: error?.message ?? "Could not create the route." };
  }

  revalidatePath("/operator");
  redirect(`/operator/routes/${route.id}`);
}

export async function addRouteStop(
  routeId: string,
  _state: RouteStopFormState,
  formData: FormData
): Promise<RouteStopFormState> {
  const validatedFields = RouteStopFormSchema.safeParse({
    neighborhoodId: formData.get("neighborhoodId"),
    stopOrder: formData.get("stopOrder"),
    pickupNote: formData.get("pickupNote"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  // Confirms this route belongs to the signed-in user's operator before
  // writing — RLS would also block it, but this gives a clean form error
  // instead of a silent insert failure.
  const { route } = await getOwnedRouteDetail(routeId);

  const { neighborhoodId, stopOrder, pickupNote } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase.from("tongtong_route_stops").insert({
    route_id: route.id,
    neighborhood_id: neighborhoodId,
    stop_order: stopOrder,
    pickup_note: pickupNote || null,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath(`/operator/routes/${routeId}`);
  return undefined;
}

export async function addSchedule(
  routeId: string,
  _state: ScheduleFormState,
  formData: FormData
): Promise<ScheduleFormState> {
  const validatedFields = ScheduleFormSchema.safeParse({
    daysOfWeek: formData.getAll("daysOfWeek"),
    departureTime: formData.get("departureTime"),
    bookingCutoffMinutes: formData.get("bookingCutoffMinutes"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { route } = await getOwnedRouteDetail(routeId);

  const { daysOfWeek, departureTime, bookingCutoffMinutes } = validatedFields.data;
  const supabase = await createClient();

  const { error } = await supabase.from("tongtong_schedules").insert({
    route_id: route.id,
    days_of_week: daysOfWeek,
    departure_time: departureTime,
    booking_cutoff_minutes: bookingCutoffMinutes,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath(`/operator/routes/${routeId}`);
  return undefined;
}

export async function createTripInstance(
  routeId: string,
  _state: TripInstanceFormState,
  formData: FormData
): Promise<TripInstanceFormState> {
  const validatedFields = TripInstanceFormSchema.safeParse({
    scheduleId: formData.get("scheduleId"),
    serviceDate: formData.get("serviceDate"),
    totalCost: formData.get("totalCost"),
    minRiders: formData.get("minRiders"),
    maxRiders: formData.get("maxRiders"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { route, schedules } = await getOwnedRouteDetail(routeId);
  const { scheduleId, serviceDate, totalCost, minRiders, maxRiders } = validatedFields.data;

  const schedule = schedules.find((s) => s.id === scheduleId);
  if (!schedule) {
    return { message: "That schedule no longer exists on this route." };
  }

  // departure_at/booking_cutoff_at are derived from the schedule's
  // departure_time + booking_cutoff_minutes rather than entered by hand,
  // so a trip instance always matches the recurrence it was opened from.
  const departureAt = new Date(`${serviceDate}T${schedule.departure_time}`);
  const bookingCutoffAt = new Date(
    departureAt.getTime() - schedule.booking_cutoff_minutes * 60_000
  );

  const supabase = await createClient();
  const { error } = await supabase.from("tongtong_trip_instances").insert({
    route_id: route.id,
    schedule_id: schedule.id,
    service_date: serviceDate,
    departure_at: departureAt.toISOString(),
    booking_cutoff_at: bookingCutoffAt.toISOString(),
    total_cost: totalCost,
    min_riders: minRiders,
    max_riders: maxRiders,
  });

  if (error) {
    return {
      message:
        error.code === "23505"
          ? "A trip is already open for this route on that date."
          : error.message,
    };
  }

  revalidatePath(`/operator/routes/${routeId}`);
  return undefined;
}

export async function publishRoute(routeId: string) {
  const { route } = await getOwnedRouteDetail(routeId);
  const supabase = await createClient();

  await supabase.from("tongtong_routes").update({ status: "active" }).eq("id", route.id);

  revalidatePath(`/operator/routes/${routeId}`);
  revalidatePath("/operator");
}
