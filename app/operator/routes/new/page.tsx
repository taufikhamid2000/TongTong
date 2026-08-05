import { redirect } from "next/navigation";
import { getMyOperator } from "@/lib/operator/dal";
import { RouteForm } from "./route-form";

export default async function NewRoutePage() {
  const operator = await getMyOperator();
  if (!operator) {
    redirect("/operator");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold">Register a new route</h1>
      <RouteForm />
    </div>
  );
}
