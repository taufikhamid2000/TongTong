import * as z from "zod";

export const OperatorFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long."),
  contactPhone: z.string().trim().optional(),
  contactEmail: z.email("Please enter a valid email.").trim().optional().or(z.literal("")),
});

export type OperatorFormState =
  | {
      errors?: {
        name?: string[];
        contactPhone?: string[];
        contactEmail?: string[];
      };
      message?: string;
    }
  | undefined;

export const RouteFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long."),
  destinationName: z.string().trim().min(2, "Destination is required."),
  destinationLat: z.coerce.number().min(-90).max(90),
  destinationLng: z.coerce.number().min(-180).max(180),
});

export type RouteFormState =
  | {
      errors?: {
        name?: string[];
        destinationName?: string[];
        destinationLat?: string[];
        destinationLng?: string[];
      };
      message?: string;
    }
  | undefined;

export const RouteStopFormSchema = z.object({
  neighborhoodId: z.uuid("Choose a neighborhood."),
  stopOrder: z.coerce.number().int().min(1, "Order must be 1 or higher."),
  pickupNote: z.string().trim().optional(),
});

export type RouteStopFormState =
  | {
      errors?: {
        neighborhoodId?: string[];
        stopOrder?: string[];
        pickupNote?: string[];
      };
      message?: string;
    }
  | undefined;

export const ScheduleFormSchema = z.object({
  daysOfWeek: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(1, "Pick at least one day."),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/, "Enter a valid time."),
  bookingCutoffMinutes: z.coerce.number().int().min(5, "Must be at least 5 minutes."),
});

export type ScheduleFormState =
  | {
      errors?: {
        daysOfWeek?: string[];
        departureTime?: string[];
        bookingCutoffMinutes?: string[];
      };
      message?: string;
    }
  | undefined;

export const TripInstanceFormSchema = z
  .object({
    scheduleId: z.uuid("Choose a schedule."),
    serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date."),
    totalCost: z.coerce.number().positive("Total cost must be greater than 0."),
    minRiders: z.coerce.number().int().min(1, "Must be at least 1."),
    maxRiders: z.coerce.number().int().min(1, "Must be at least 1."),
  })
  .refine((data) => data.maxRiders >= data.minRiders, {
    message: "Max riders must be at least min riders.",
    path: ["maxRiders"],
  });

export type TripInstanceFormState =
  | {
      errors?: {
        scheduleId?: string[];
        serviceDate?: string[];
        totalCost?: string[];
        minRiders?: string[];
        maxRiders?: string[];
      };
      message?: string;
    }
  | undefined;
