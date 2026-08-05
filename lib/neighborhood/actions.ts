"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";
import { NeighborhoodFormSchema, NeighborhoodFormState } from "@/lib/neighborhood/definitions";

export async function createNeighborhood(
  _state: NeighborhoodFormState,
  formData: FormData
): Promise<NeighborhoodFormState> {
  const validatedFields = NeighborhoodFormSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const session = await verifySession();
  const supabase = await createClient();

  const { name, address, lat, lng } = validatedFields.data;
  const { error } = await supabase.from("tongtong_neighborhoods").insert({
    admin_id: session.userId,
    name,
    address,
    lat,
    lng,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/neighborhood");
  redirect("/neighborhood");
}
