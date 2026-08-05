import * as z from "zod";

export const BookingFormSchema = z.object({
  tripInstanceId: z.uuid(),
  neighborhoodId: z.uuid(),
  seatCount: z.coerce.number().int().min(1, "Book at least 1 seat.").max(8, "Max 8 seats per booking."),
});

export type BookingFormState =
  | {
      errors?: {
        seatCount?: string[];
      };
      message?: string;
    }
  | undefined;
