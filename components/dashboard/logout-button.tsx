"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <button type="button" onClick={handleLogout} disabled={isLoading} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-bold text-white transition hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-60">
      <LogOut className="h-4 w-4" /> {isLoading ? "Keluar..." : "Keluar"}
    </button>
  );
}
