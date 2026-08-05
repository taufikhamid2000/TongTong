import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold">Create your TongTong account</h1>
      <SignupForm />
    </div>
  );
}
