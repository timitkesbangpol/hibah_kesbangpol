"use client";

import { useState } from "react";
import { useMode } from "@/context/mode-context";
import {
  BellIcon,
  LockIcon,
  SaveIcon,
  ShieldIcon,
  UploadIcon,
  UsersIcon,
} from "./icons";

type Tab = "profil" | "keamanan" | "notifikasi";

const allTabs: { id: Tab; label: string; icon: (p: { className?: string }) => React.ReactNode }[] = [
  { id: "profil", label: "Profil Organisasi", icon: UsersIcon },
  { id: "keamanan", label: "Keamanan", icon: LockIcon },
  { id: "notifikasi", label: "Notifikasi", icon: BellIcon },
];

const notifOptions = [
  {
    title: "Proposal baru masuk",
    desc: "Notifikasi saat ada pengajuan proposal hibah baru.",
    defaultOn: true,
  },
  {
    title: "Status pencairan dana",
    desc: "Notifikasi saat pencairan dana disetujui atau ditolak.",
    defaultOn: true,
  },
  {
    title: "Laporan bulanan siap",
    desc: "Pengingat saat laporan realisasi bulanan dibuat otomatis.",
    defaultOn: false,
  },
  {
    title: "Pengguna baru terdaftar",
    desc: "Notifikasi saat ada akun pengguna baru yang dibuat.",
    defaultOn: false,
  },
];

function Toggle({ defaultOn, label }: { defaultOn: boolean; label: string }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn((v) => !v)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${
        on ? "bg-red-600" : "bg-zinc-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          on ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700";

export default function SettingsPanel() {
  const { mode } = useMode();
  const [tab, setTab] = useState<Tab>("profil");

  const tabs = mode === "bidang" ? allTabs.filter((t) => t.id !== "notifikasi") : allTabs;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-red-600 text-white shadow-sm shadow-red-600/30"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "profil" && (
        <div className="space-y-6">
          {/* Logo / identity */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold">Identitas Akun</h2>
            <p className="text-sm text-zinc-500">
              Informasi yang ditampilkan pada dokumen dan laporan.
            </p>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30">
                <ShieldIcon className="h-7 w-7" />
              </div>
              <div>
                <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600">
                  <UploadIcon className="h-4 w-4" />
                  Unggah Foto Profile
                </button>
                <p className="mt-1.5 text-xs text-zinc-400">
                  PNG atau SVG, maksimal 1 MB
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nama" className={labelClass}>
                  Nama Organisasi
                </label>
                <input
                  id="nama"
                  defaultValue="Badan Kesatuan Bangsa dan Politik"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="singkatan" className={labelClass}>
                  Singkatan
                </label>
                <input id="singkatan" defaultValue="Kesbangpol" className={inputClass} />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email Resmi
                </label>
                <input
                  id="email"
                  type="email"
                  defaultValue="info@kesbangpol.go.id"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="telepon" className={labelClass}>
                  Telepon
                </label>
                <input id="telepon" defaultValue="(021) 1234-5678" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="alamat" className={labelClass}>
                  Alamat
                </label>
                <textarea
                  id="alamat"
                  rows={3}
                  defaultValue="Jl. Jenderal Sudirman No. 1, Jakarta Pusat"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-500 active:scale-[0.98]">
                <SaveIcon className="h-4 w-4" />
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "keamanan" && (
        <div className="space-y-6">
          <form className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold">Ubah Kata Sandi</h2>
            <p className="text-sm text-zinc-500">
              Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="pass-lama" className={labelClass}>
                  Kata Sandi Lama
                </label>
                <input id="pass-lama" type="password" placeholder="••••••••" className={inputClass} />
              </div>
              <div>
                <label htmlFor="pass-baru" className={labelClass}>
                  Kata Sandi Baru
                </label>
                <input id="pass-baru" type="password" placeholder="••••••••" className={inputClass} />
              </div>
              <div>
                <label htmlFor="pass-konfirmasi" className={labelClass}>
                  Konfirmasi Kata Sandi
                </label>
                <input
                  id="pass-konfirmasi"
                  type="password"
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-500 active:scale-[0.98]"
              >
                <SaveIcon className="h-4 w-4" />
                Perbarui Kata Sandi
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Autentikasi Dua Faktor</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Tambahkan lapisan keamanan ekstra saat masuk ke akun. Kode verifikasi akan
                  dikirim ke email Anda.
                </p>
              </div>
              <Toggle defaultOn={true} label="Autentikasi dua faktor" />
            </div>
          </div>
        </div>
      )}

      {tab === "notifikasi" && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold">Preferensi Notifikasi</h2>
          <p className="text-sm text-zinc-500">
            Pilih notifikasi apa saja yang ingin Anda terima.
          </p>
          <ul className="mt-4 divide-y divide-zinc-100">
            {notifOptions.map((o) => (
              <li key={o.title} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium">{o.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{o.desc}</p>
                </div>
                <Toggle defaultOn={o.defaultOn} label={o.title} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
