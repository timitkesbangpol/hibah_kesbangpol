import Link from "next/link";
import { PlusIcon, DocumentIcon, ArchiveIcon } from "@/components/icons";
import { bidangInfo, BidangId, Mode } from "@/context/mode-context";
import HeroBanner from "@/components/hero-banner";

type DashboardBannerProps = {
  mode: Mode;
  bidangId: BidangId;
  currentYear: number;
  getUrl: (tab: string) => string;
};

/**
 * DashboardBanner - Banner navigasi atas dengan indikator mode peran dan tombol aksi cepat.
 */
export default function DashboardBanner({
  mode,
  bidangId,
  currentYear,
  getUrl,
}: DashboardBannerProps) {
  const badgeTitle =
    mode === "admin" ? "Sistem Utama" : mode === "kaban" ? "Eksekutif" : `Bidang ${bidangId}`;
  const bannerTitle =
    mode === "admin"
      ? "Sistem Pengarsipan Hibah Daerah"
      : mode === "kaban"
      ? "Monitoring Arsip Hibah Daerah — Kepala Badan"
      : `Pengarsipan Hibah Bidang ${bidangId}`;
  const bannerDesc =
    mode === "admin"
      ? "Kelola dokumen, verifikasi usulan, dan kontrol penataan lemari arsip secara terintegrasi."
      : mode === "kaban"
      ? "Mode pemantauan eksekutif: rekapitulasi data usulan, alokasi anggaran, dan ketersediaan lemari arsip."
      : `${bidangInfo[bidangId].fullName}. Kelola dan arsipkan berkas hibah teknis bidang.`;

  return (
    <HeroBanner
      badgeSlot={
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase backdrop-blur-xs">
            {badgeTitle}
          </span>
          <span className="text-xs text-red-200">• Tahun Anggaran {currentYear}</span>
        </div>
      }
      title={bannerTitle}
      description={bannerDesc}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {mode !== "kaban" && (
            <Link
              href={getUrl("Dokumen")}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-red-700 shadow-md transition hover:bg-red-50 active:scale-95"
            >
              <PlusIcon className="h-4 w-4 text-red-600" />
              <span>Usulan Baru</span>
            </Link>
          )}
          <Link
            href={getUrl("Dokumen")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
          >
            <DocumentIcon className="h-4 w-4" />
            <span>Daftar Dokumen</span>
          </Link>
          <Link
            href={getUrl("Lemari")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
          >
            <ArchiveIcon className="h-4 w-4" />
            <span>Denah Lemari</span>
          </Link>
        </div>
      }
    />
  );
}
