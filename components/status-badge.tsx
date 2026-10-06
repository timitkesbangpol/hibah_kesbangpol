import React from "react";

const statusStyles: Record<string, string> = {
  // Lemari Arsip styles
  "Lemari Arsip 01": "bg-blue-50 text-blue-700 ring-blue-600/20",
  "Lemari Arsip 02": "bg-rose-50 text-rose-700 ring-rose-600/20",
  "Lemari Arsip 03": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "Lemari Arsip 04": "bg-purple-50 text-purple-700 ring-purple-600/20",
  "Lemari Arsip Khusus": "bg-teal-50 text-teal-700 ring-teal-600/20",

  // Generic / System status styles
  Selesai: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Menunggu: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Aktif: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Nonaktif: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
  Verifikasi: "bg-sky-50 text-sky-700 ring-sky-600/20",
  Final: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Draft: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
};

export default function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap shrink-0 ${
        statusStyles[status] ?? statusStyles.Nonaktif
      }`}
    >
      <span>{status}</span>
    </span>
  );
}

export function RetentionBadge({ isOlder }: { isOlder: boolean }) {
  if (isOlder) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-inset ring-amber-600/20 whitespace-nowrap shrink-0">
        <span>&gt; 8 Thn (Retensi)</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap shrink-0">
      <span>Aktif (&le; 8 Thn)</span>
    </span>
  );
}

export function LokasiArsipBadge({
  lemari,
  rak = "Rak 01",
  nomor = "No. 01",
  compact = false,
}: {
  lemari: string;
  rak?: string;
  nomor?: string;
  compact?: boolean;
}) {
  const isKosong =
    !lemari ||
    lemari === "Dikosongkan" ||
    lemari.toLowerCase().includes("kosong") ||
    lemari.toLowerCase().includes("tanpa");

  if (isKosong) {
    if (compact) {
      return (
        <span
          title="Lokasi fisik belum dialokasikan / lemari dikosongkan"
          className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-500 ring-1 ring-inset ring-zinc-300/80 whitespace-nowrap shrink-0"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
          <span>Dikosongkan</span>
        </span>
      );
    }

    return (
      <span
        title="Lokasi fisik belum dialokasikan / lemari dikosongkan"
        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 ring-1 ring-inset ring-zinc-300/80 whitespace-nowrap shrink-0"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
        <span>Dikosongkan</span>
      </span>
    );
  }

  const lemariColor = statusStyles[lemari] ?? "bg-zinc-100 text-zinc-700 ring-zinc-300";
  
  // Format kode ringkas: L.01, R.01, #01
  const lNum = lemari.replace(/[^0-9]/g, "");
  const lCode = lemari.toLowerCase().includes("khusus")
    ? "Khusus"
    : lNum
    ? `L.${lNum}`
    : lemari.replace("Lemari Arsip ", "L.");

  const rNum = rak.replace(/[^0-9]/g, "");
  const rCode = rNum ? `R.${rNum}` : rak;

  const nNum = nomor.replace(/[^0-9]/g, "");
  const nCode = nNum ? `#${nNum}` : nomor;

  const fullTitle = `${lemari} • ${rak} • ${nomor}`;

  if (compact) {
    return (
      <span
        title={fullTitle}
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap shrink-0 ${lemariColor}`}
      >
        <span className="font-bold">{lCode}</span>
        <span className="opacity-30 select-none">•</span>
        <span className="font-semibold">{rCode}</span>
        <span className="opacity-30 select-none">•</span>
        <span className="font-mono font-bold">{nCode}</span>
      </span>
    );
  }

  return (
    <span
      title={fullTitle}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap shrink-0 ${lemariColor}`}
    >
      <span className="font-bold">{lCode}</span>
      <span className="opacity-35 select-none">•</span>
      <span className="font-semibold">{rCode}</span>
      <span className="opacity-35 select-none">•</span>
      <span className="font-mono font-bold">{nCode}</span>
    </span>
  );
}
