"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center font-black text-slate-700 uppercase tracking-[0.5em] animate-pulse">
      Redirecting to Security Station...
    </div>
  );
}
