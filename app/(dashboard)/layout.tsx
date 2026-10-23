"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMode } from "@/context/mode-context";
import DashboardShell from "../../components/dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, authInitialized, getUrl } = useMode();

  useEffect(() => {
    if (!authInitialized) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    // Redirect legacy routes to enterprise portal URL structure
    if (!pathname.startsWith("/portal/u/")) {
      const slug = pathname.replace(/^\//, "") || "Beranda";
      const targetSlug = slug.charAt(0).toUpperCase() + slug.slice(1);
      router.replace(getUrl(targetSlug || "Beranda"));
    }
  }, [pathname, isLoggedIn, authInitialized, router, getUrl]);

  if (!authInitialized || !isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white font-poppins">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-3 border-red-500 border-t-transparent" />
          <p className="text-xs text-slate-300">Memeriksa hak akses sistem...</p>
        </div>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
