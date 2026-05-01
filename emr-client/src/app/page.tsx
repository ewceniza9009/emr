import { redirect } from "next/navigation";

export default function Home() {
  // Automatically whisk the user away to the Mission Control
  redirect("/dashboard");
}
