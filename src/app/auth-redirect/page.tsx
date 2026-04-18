import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "DOCTOR") {
    redirect("/doctor/dashboard");
  }

  redirect("/patient/dashboard");
}
