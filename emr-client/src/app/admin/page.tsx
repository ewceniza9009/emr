import { redirect } from "next/navigation";

export default function AdminPage() {
  // Simple redirect to the admin dashboard
  // Middleware should handle the authentication check
  redirect("/admin/dashboard");
}
