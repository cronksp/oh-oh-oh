import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSession();

  if (session?.user) {
    // User is logged in, redirect to calendar
    redirect("/calendar");
  } else {
    // User is not logged in, redirect to login
    redirect("/login");
  }
}
