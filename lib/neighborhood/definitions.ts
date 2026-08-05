import * as z from "zod";

export const NeighborhoodFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long."),
  address: z.string().trim().min(5, "Enter a full address."),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export type NeighborhoodFormState =
  | {
      errors?: {
        name?: string[];
        address?: string[];
        lat?: string[];
        lng?: string[];
      };
      message?: string;
    }
  | undefined;
