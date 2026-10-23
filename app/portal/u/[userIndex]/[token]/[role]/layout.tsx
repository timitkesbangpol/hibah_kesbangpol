"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMode } from "@/context/mode-context";
import DashboardShell from "@/components/dashboard-shell";
import { ShieldIcon } from "@/components/icons";
import Link from "next/link";

export default function EnterprisePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const { currentUser, isLoggedIn, authInitialized, verifyAccess, getHomeUrl } = useMode();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const tokenParam = Array.isArray(params.token) ? params.token[0] : params.token || "";
  const roleParam = Array.isArray(params.role) ? params.role[0] : params.role || "";

  useEffect(() => {
    if (!authInitialized) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    // Verifikasi keamanan URL: token & role harus cocok dengan sesi akun yang aktif
    const valid = verifyAccess(tokenParam, roleParam);
    setIsAuthorized(valid);
  }, [tokenParam, roleParam, isLoggedIn, authInitialized, currentUser, verifyAccess, router]);

  if (!authInitialized || isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-xs font-semibold text-zinc-400">
        Memverifikasi sesi portal terenkripsi...
      </div>
    );
  }

  // Anti-tamper security interceptor
  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-zinc-900/90 p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 ring-1 ring-red-500/30">
            <ShieldIcon className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-white">
            Akses Dibatasi — Security Guard
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            Token sesi atau folder direktori role (<span className="font-mono text-red-400">/{roleParam}</span>) tidak cocok dengan hak akses akun Anda (<span className="font-bold text-zinc-200">{currentUser.name}</span>).
          </p>
          <div className="mt-6 space-y-2">
            <Link
              href={getHomeUrl()}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-red-600 px-4 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500"
            >
              Kembali ke Portal Resmi Akun Anda
            </Link>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Keluar & Ganti Akun
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
