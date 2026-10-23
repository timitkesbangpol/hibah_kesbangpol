"use client";

import React from "react";
import { LemariArsip, LEMARI_OPTIONS, RAK_OPTIONS } from "@/context/hibah-context";
import { ArchiveIcon } from "./icons";

export interface AlokasiLemariFieldProps {
  lemari: LemariArsip;
  rak: string;
  nomor: string;
  onChangeLemari: (lemari: LemariArsip) => void;
  onChangeRak: (rak: string) => void;
  onChangeNomor: (nomor: string) => void;
  defaultLemari?: LemariArsip;
  disabled?: boolean;
}

export function AlokasiLemariField({
  lemari,
  rak,
  nomor,
  onChangeLemari,
  onChangeRak,
  onChangeNomor,
  defaultLemari = "Lemari Arsip 01",
  disabled = false,
}: AlokasiLemariFieldProps) {
  const isKosong =
    lemari === "Dikosongkan" ||
    lemari?.toLowerCase().includes("kosong") ||
    lemari?.toLowerCase().includes("tanpa");

  const handleSetDiisi = () => {
    const targetLemari =
      defaultLemari && defaultLemari !== "Dikosongkan"
        ? defaultLemari
        : "Lemari Arsip 01";
    onChangeLemari(targetLemari);
    if (!rak || rak === "-") onChangeRak("Rak 01");
    if (!nomor || nomor === "-") onChangeNomor("No. 01");
  };

  const handleSetDikosongkan = () => {
    onChangeLemari("Dikosongkan");
    onChangeRak("-");
    onChangeNomor("-");
  };

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4 space-y-3 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ArchiveIcon className="h-4 w-4 text-red-600 shrink-0" />
          <p className="text-xs font-bold text-zinc-900">Alokasi Lokasi Fisik Penyimpanan Arsip</p>
        </div>

        {/* Toggle Pilihan Mau Dikosongin atau Diisi */}
        <div className="flex items-center rounded-xl bg-white p-1 border border-zinc-200/90 shadow-2xs">
          <button
            type="button"
            disabled={disabled}
            onClick={handleSetDiisi}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              !isKosong
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
            title="Alokasikan lemari arsip fisik, posisi rak, dan nomor berkas"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                !isKosong ? "bg-white" : "bg-emerald-500"
              }`}
            />
            Diisi (Ada Lemari)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={handleSetDikosongkan}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              isKosong
                ? "bg-amber-600 text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
            title="Kosongkan lemari / dokumen belum dialokasikan ke lemari fisik"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isKosong ? "bg-white" : "bg-amber-500"
              }`}
            />
            Dikosongkan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Lemari Arsip */}
        <div>
          <label className="mb-1 block text-[11px] font-bold text-zinc-700">
            1. Lemari Arsip {!isKosong && "*"}
          </label>
          <select
            disabled={disabled}
            value={isKosong ? "Dikosongkan" : lemari}
            onChange={(e) => {
              const val = e.target.value as LemariArsip;
              if (val === "Dikosongkan") {
                handleSetDikosongkan();
              } else {
                onChangeLemari(val);
                if (!rak || rak === "-") onChangeRak("Rak 01");
                if (!nomor || nomor === "-") onChangeNomor("No. 01");
              }
            }}
            className={`w-full rounded-xl border px-3 py-2 text-xs font-bold outline-none transition ${
              isKosong
                ? "border-amber-200 bg-amber-50/50 text-amber-900"
                : "border-zinc-200 bg-white text-zinc-800 focus:border-red-400"
            }`}
          >
            <option value="Dikosongkan">— Dikosongkan (Tanpa Lemari) —</option>
            {LEMARI_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Posisi Rak */}
        <div>
          <label className="mb-1 block text-[11px] font-bold text-zinc-700">
            2. Posisi Rak {!isKosong && "*"}
          </label>
          {isKosong ? (
            <input
              type="text"
              disabled
              value="— (Dikosongkan)"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-100/80 px-3 py-2 text-xs font-medium text-zinc-400 outline-none cursor-not-allowed"
            />
          ) : (
            <select
              disabled={disabled}
              value={rak && rak !== "-" ? rak : "Rak 01"}
              onChange={(e) => onChangeRak(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-800 outline-none focus:border-red-400"
            >
              {RAK_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 3. Nomor Berkas / Urut */}
        <div>
          <label className="mb-1 block text-[11px] font-bold text-zinc-700">
            3. Nomor Berkas / Urut {!isKosong && "*"}
          </label>
          {isKosong ? (
            <input
              type="text"
              disabled
              value="— (Dikosongkan)"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-100/80 px-3 py-2 text-xs font-medium text-zinc-400 outline-none cursor-not-allowed"
            />
          ) : (
            <input
              type="text"
              disabled={disabled}
              required
              placeholder="Misal: No. 05"
              value={nomor === "-" ? "" : nomor}
              onChange={(e) => onChangeNomor(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold font-mono text-zinc-900 outline-none focus:border-red-400"
            />
          )}
        </div>
      </div>

      {/* Info status saat dikosongkan */}
      {isKosong && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200/90 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900">
              ℹ
            </span>
            <span>
              Lemari berstatus <strong>Dikosongkan</strong>. Berkas ini belum dialokasikan ke lemari atau rak fisik manapun.
            </span>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={handleSetDiisi}
            className="ml-2 shrink-0 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-700 transition"
          >
            Isi Lemari Sekarang
          </button>
        </div>
      )}
    </div>
  );
}
