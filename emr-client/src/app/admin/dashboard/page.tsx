"use client";

import { Suspense } from "react";
import AdminDashboardContent from "./AdminDashboardContent";
import AdminLoadingState from "./components/AdminLoadingState";

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <AdminLoadingState message="Synchronizing Security Session..." />
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
