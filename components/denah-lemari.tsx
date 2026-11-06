"use client";

import { useState, useMemo } from "react";
import { useMode, bidangInfo, BidangId } from "@/context/mode-context";
import {
  useHibah,
  ProposalItem,
  LemariArsip,
  LEMARI_OPTIONS,
  RAK_OPTIONS,
} from "@/context/hibah-context";
import {
  ArchiveIcon,
  BuildingIcon,
  DocumentIcon,
  DownloadIcon,
  EyeIcon,
  MoneyIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from "./icons";
import HeroBanner from "./hero-banner";

const formatRupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

type DisplayDocument = ProposalItem & { displayKey: string };

const LEMARI_DETAILS: Record<
  LemariArsip,
  {
    title: string;
    deskripsi: string;
    bidang: string;
    bidangId?: BidangId;
    color: string;
    bgBadge: string;
    accentBorder: string;
    headerBg: string;
  }
> = {
  "Lemari Arsip 01": {
    title: "Lemari Arsip 01",
    deskripsi: "Penyimpanan berkas Ideologi, Wawasan Kebangsaan & Karakter Bangsa",
    bidang: "Bidang 1",
    bidangId: 1,
    color: "text-blue-600",
    bgBadge: "bg-blue-50 text-blue-700 border-blue-200",
    accentBorder: "border-blue-500",
    headerBg: "from-blue-600 to-indigo-700",
  },
  "Lemari Arsip 02": {
    title: "Lemari Arsip 02",
    deskripsi: "Penyimpanan berkas Politik Dalam Negeri & Organisasi Kemasyarakatan",
    bidang: "Bidang 2",
    bidangId: 2,
    color: "text-rose-600",
    bgBadge: "bg-rose-50 text-rose-700 border-rose-200",
    accentBorder: "border-rose-500",
    headerBg: "from-red-600 to-rose-700",
  },
  "Lemari Arsip 03": {
    title: "Lemari Arsip 03",
    deskripsi: "Penyimpanan berkas Ketahanan Seni, Budaya, Agama & Kemasyarakatan",
    bidang: "Bidang 3",
    bidangId: 3,
    color: "text-amber-600",
    bgBadge: "bg-amber-50 text-amber-700 border-amber-200",
    accentBorder: "border-amber-500",
    headerBg: "from-amber-500 to-orange-600",
  },
  "Lemari Arsip 04": {
    title: "Lemari Arsip 04",
    deskripsi: "Penyimpanan berkas Kewaspadaan Dini & Penanganan Konflik Sosial",
    bidang: "Bidang 4",
    bidangId: 4,
    color: "text-purple-600",
    bgBadge: "bg-purple-50 text-purple-700 border-purple-200",
    accentBorder: "border-purple-500",
    headerBg: "from-purple-600 to-indigo-700",
  },
  "Lemari Arsip Khusus": {
    title: "Lemari Arsip Khusus",
    deskripsi: "Penyimpanan NPHD Asli, SK Penetapan Walikota & Dokumen Vital Hibah",
    bidang: "Dokumen Khusus",
    color: "text-teal-600",
    bgBadge: "bg-teal-50 text-teal-700 border-teal-200",
    accentBorder: "border-teal-500",
    headerBg: "from-teal-600 to-emerald-700",
  },
  "Dikosongkan": {
    title: "Belum Masuk Lemari",
    deskripsi: "Berkas yang status lemarinya dikosongkan / belum dialokasikan ke lemari fisik",
    bidang: "Tanpa Lemari",
    color: "text-zinc-600",
    bgBadge: "bg-zinc-100 text-zinc-700 border-zinc-200",
    accentBorder: "border-zinc-400",
    headerBg: "from-zinc-600 to-zinc-700",
  },
};

export default function DenahLemari() {
  const { mode, bidangId } = useMode();
  const { proposals, arsipList, kosongkanLemari } = useHibah();
  const visibleProposals = mode === "bidang" ? proposals.filter((p) => p.bidangId === bidangId) : proposals;
  const visibleArsipList = mode === "bidang" ? arsipList.filter((a) => a.bidangId === bidangId) : arsipList;

  // Combine unique documents for display (proposals + standalone arsip documents)
  const allDocs = useMemo(() => {
    const standaloneArsip: DisplayDocument[] = visibleArsipList
      .filter((a) => {
        // Skip duplicate proposal entries created automatically by addProposal
        return !visibleProposals.some(
          (p) =>
            a.judul === `Proposal & Berkas Hibah: ${p.name}` ||
            (a.nominal && a.nominal === p.nominal && a.instansi === p.instansi)
        );
      })
      .map((a, idx) => ({
        id: a.dbId || 100000 + idx,
        displayKey: `arsip-${a.dbId || idx}`,
        dbId: a.dbId,
        name: a.judul,
        instansi: a.instansi,
        bidangId: a.bidangId,
        kategori: a.jenis,
        nominal: a.nominal || 0,
        tanggal: a.tanggal,
        tahun: a.tahun || a.tanggal.match(/\d{4}/)?.[0] || new Date().getFullYear().toString(),
        lemariArsip: a.lemariArsip,
        rakArsip: a.rakArsip || "Rak 01",
        nomorArsip: a.nomorArsip || "No. 01",
        pic: a.pic || "",
        noTelp: a.noTelp || "",
        catatan: a.catatan || "",
        fileName: a.fileName,
        fileSize: a.ukuran,
        fileDataUrl: a.fileDataUrl,
        fileType: a.fileType,
      }));

    const proposalDocs: DisplayDocument[] = visibleProposals.map((proposal) => ({
      ...proposal,
      displayKey: `proposal-${proposal.id}`,
    }));

    return [...proposalDocs, ...standaloneArsip];
  }, [visibleArsipList, visibleProposals]);

  const visibleLemariOptions = mode === "bidang"
    ? LEMARI_OPTIONS.filter((lem) => lem.bidangId === bidangId)
    : LEMARI_OPTIONS;

  const defaultLemari: LemariArsip =
    mode === "bidang"
      ? (bidangId === 1
          ? "Lemari Arsip 01"
          : bidangId === 2
          ? "Lemari Arsip 02"
          : bidangId === 3
          ? "Lemari Arsip 03"
          : "Lemari Arsip 04")
      : "Lemari Arsip 01";

  const [selectedLemari, setSelectedLemari] = useState<LemariArsip>(defaultLemari);
  const [selectedRak, setSelectedRak] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalDoc, setActiveModalDoc] = useState<ProposalItem | null>(null);

  // Statistics per cabinet
  const lemariStats = useMemo(() => {
    const stats: Record<string, { count: number; nominal: number }> = {};
    LEMARI_OPTIONS.forEach((lem) => {
      const docsInLemari = allDocs.filter((d) => d.lemariArsip === lem.id);
      stats[lem.id] = {
        count: docsInLemari.length,
        nominal: docsInLemari.reduce((sum, d) => sum + (d.nominal || 0), 0),
      };
    });
    // Stats for Dikosongkan
    const docsDikosongkan = allDocs.filter(
      (d) => !d.lemariArsip || d.lemariArsip === "Dikosongkan"
    );
    stats["Dikosongkan"] = {
      count: docsDikosongkan.length,
      nominal: docsDikosongkan.reduce((sum, d) => sum + (d.nominal || 0), 0),
    };
    return stats;
  }, [allDocs]);

  // Documents inside current selected cabinet
  const currentLemariDocs = useMemo(() => {
    if (selectedLemari === "Dikosongkan") {
      return allDocs.filter((d) => !d.lemariArsip || d.lemariArsip === "Dikosongkan");
    }
    return allDocs.filter((d) => d.lemariArsip === selectedLemari);
  }, [allDocs, selectedLemari]);

  // Filtered by selected rak and search query
  const filteredDocs = useMemo(() => {
    return currentLemariDocs.filter((d) => {
      const matchRak =
        selectedLemari === "Dikosongkan" ||
        selectedRak === "Semua" ||
        (d.rakArsip || "Rak 01") === selectedRak;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.instansi.toLowerCase().includes(q) ||
        (d.nomorArsip || "").toLowerCase().includes(q) ||
        (d.tahun || "").includes(q);
      return matchRak && matchQuery;
    });
  }, [currentLemariDocs, selectedRak, searchQuery, selectedLemari]);

  const currentInfo = LEMARI_DETAILS[selectedLemari];

  return (
    <div className="space-y-5">
      {/* ── Banner Header (Tema Merah & Putih Kesbangpol) ─────────── */}
      <HeroBanner
        badgeIcon={<ArchiveIcon className="h-3.5 w-3.5" />}
        badgeText="Gudang Penyimpanan Fisik Kesbangpol"
        title="Denah Lemari & Rak Arsip Fisik"
        description="Pemetaan visual posisi ordner dokumen hibah pada 5 lemari dan rak fisik di ruang arsip."
        stats={[
          { label: "Total Berkas", value: allDocs.length },
          { label: "Lemari Aktif", value: `${visibleLemariOptions.length} Unit` },
        ]}
      />

      <div>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-zinc-900">Pilih lemari penyimpanan</h2>
            <p className="mt-1 text-sm text-zinc-500">Pilih satu lemari untuk melihat posisi dan detail berkas.</p>
          </div>
          <span className="text-xs font-medium text-zinc-400">{visibleLemariOptions.length} lokasi penyimpanan</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {visibleLemariOptions.map((lem) => {
            const isSelected = selectedLemari === lem.id;
            const details = LEMARI_DETAILS[lem.id];
            const stats = lemariStats[lem.id] || { count: 0, nominal: 0 };

            return (
              <button
                key={lem.id}
                type="button"
                onClick={() => {
                  setSelectedLemari(lem.id);
                  setSelectedRak("Semua");
                }}
                aria-pressed={isSelected}
                className={`group flex min-h-52 flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20 ${
                  isSelected
                    ? "border-violet-300 bg-violet-50/60 shadow-md shadow-violet-950/5 ring-1 ring-violet-200"
                    : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                        isSelected ? "bg-violet-700 text-white shadow-md shadow-violet-700/20" : "bg-zinc-100 text-zinc-600 group-hover:bg-violet-100 group-hover:text-violet-700"
                      }`}
                    >
                      <ArchiveIcon className="h-5 w-5" />
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${details.bgBadge}`}
                    >
                      {details.bidang}
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-bold leading-snug text-zinc-900">
                    {lem.label}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                    {details.deskripsi}
                  </p>
                </div>

                <div className="mt-4 border-t border-zinc-200/80 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">Berkas tersimpan</span>
                    <span className="text-sm font-bold text-zinc-900">{stats.count}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                    <MoneyIcon className="h-3.5 w-3.5 text-violet-500" />
                    <span>{formatRupiah(stats.nominal)}</span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Card Lemari Dikosongkan */}
          {(() => {
            const isKosongSelected = selectedLemari === "Dikosongkan";
            const kStats = lemariStats["Dikosongkan"] || { count: 0, nominal: 0 };
            return (
              <button
                type="button"
                onClick={() => {
                  setSelectedLemari("Dikosongkan");
                  setSelectedRak("Semua");
                }}
                aria-pressed={isKosongSelected}
                className={`group flex min-h-52 flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 ${
                  isKosongSelected
                    ? "border-amber-300 bg-amber-50/60 shadow-md shadow-amber-950/5 ring-1 ring-amber-200"
                    : "border-dashed border-zinc-300 bg-white hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                        isKosongSelected ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" : "bg-zinc-100 text-zinc-600 group-hover:bg-amber-100 group-hover:text-amber-700"
                      }`}
                    >
                      <ArchiveIcon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                      Tanpa Lemari
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-bold leading-snug text-zinc-900">
                    Dikosongkan
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                    Berkas belum dialokasikan ke lemari fisik
                  </p>
                </div>

                <div className="mt-4 border-t border-zinc-200/80 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">Berkas tersimpan</span>
                    <span className="text-sm font-bold text-amber-700">{kStats.count}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                    <MoneyIcon className="h-3.5 w-3.5 text-amber-500" />
                    <span>{formatRupiah(kStats.nominal)}</span>
                  </div>
                </div>
              </button>
            );
          })()}
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm shadow-zinc-950/[0.03]">
        <div className="flex flex-col justify-between gap-5 border-b border-zinc-100 bg-zinc-50/70 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-700 text-white shadow-md shadow-violet-700/20">
              <ArchiveIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-zinc-900">{currentInfo.title}</h2>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${currentInfo.bgBadge}`}>
                  {currentInfo.bidang}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{currentInfo.deskripsi}</p>
            </div>
          </div>

          {/* Search & Filter Rak & Tombol Kosongkan */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Kosongkan Lemari Ini */}
            {selectedLemari !== "Dikosongkan" && currentLemariDocs.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  if (
                    confirm(
                      `Apakah Anda yakin ingin MENGOSONGKAN ${currentInfo.title}?\n\nSemua berkas di lemari ini (${currentLemariDocs.length} dokumen) akan dipindahkan statusnya menjadi "Dikosongkan".`
                    )
                  ) {
                    await kosongkanLemari(selectedLemari);
                  }
                }}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 text-xs font-semibold text-amber-800 transition hover:border-amber-300 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/15"
                title="Kosongkan seluruh lemari ini"
              >
                <TrashIcon className="h-3.5 w-3.5 text-amber-600" />
                <span>Kosongkan Lemari Ini ({currentLemariDocs.length})</span>
              </button>
            )}

            {/* Filter Rak Dropdown (Hanya jika bukan Dikosongkan) */}
            {selectedLemari !== "Dikosongkan" && (
              <select
                value={selectedRak}
                onChange={(e) => setSelectedRak(e.target.value)}
                aria-label="Pilih Rak Fisik"
                className="h-11 min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 outline-none transition hover:border-zinc-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
              >
                <option value="Semua">Semua Rak (Rak 01 - 05)</option>
                {RAK_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}

            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cari berkas arsip"
                placeholder={
                  selectedLemari === "Dikosongkan"
                    ? "Cari berkas tanpa lemari..."
                    : "Cari berkas di lemari ini..."
                }
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
              />
            </div>
          </div>
        </div>

        {/* Rak Physical Shelving Layout / Dikosongkan Layout */}
        <div className="space-y-4 p-4 sm:p-6">
          {selectedLemari === "Dikosongkan" ? (
            <div className="space-y-4">
              <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <ArchiveIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950">
                      Daftar Berkas Tanpa Lemari / Dikosongkan
                    </h3>
                    <p className="text-xs text-amber-800/80">
                      Dokumen berikut berstatus belum dialokasikan ke nomor lemari atau rak fisik manapun ({filteredDocs.length} berkas).
                    </p>
                  </div>
                </div>
              </div>

              {filteredDocs.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center text-xs text-zinc-400">
                  <ArchiveIcon className="h-8 w-8 text-zinc-300 mb-2" />
                  <p className="font-semibold text-zinc-600">Tidak ada berkas yang berstatus Dikosongkan.</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Semua berkas saat ini telah dialokasikan ke lemari arsip fisik.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.displayKey}
                      className="group flex min-w-0 flex-col justify-between rounded-2xl border border-amber-200/80 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-950/5"
                    >
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                            Dikosongkan
                          </span>
                          <span className="text-[11px] font-medium text-zinc-400">
                            Tahun {doc.tahun || doc.tanggal?.match(/\d{4}/)?.[0] || "—"}
                          </span>
                        </div>

                        <h4 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-zinc-900">
                          {doc.name}
                        </h4>

                        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-zinc-500">
                          <BuildingIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          <span className="truncate">{doc.instansi}</span>
                        </div>

                        <p className="mt-3 text-sm font-bold text-zinc-900">
                          {formatRupiah(doc.nominal)}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${doc.fileName ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {doc.fileName ? "Scan tersedia" : "Fisik saja"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveModalDoc(doc)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          <span>Detail</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            RAK_OPTIONS.filter((rak) => selectedRak === "Semua" || rak === selectedRak).map((rak) => {
              const docsInThisRak = filteredDocs.filter(
                (d) => (d.rakArsip || "Rak 01") === rak
              );

              return (
                <div
                  key={rak}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 sm:p-5"
                >
                  {/* Shelf Header */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 font-mono text-xs font-bold text-violet-700">
                        {rak.replace("Rak ", "R")}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900">{rak}</h3>
                        <p className="text-xs text-zinc-500">{docsInThisRak.length} berkas tersimpan</p>
                      </div>
                    </div>

                    <span className="text-xs font-medium text-zinc-400">
                      {selectedLemari} &bull; {rak}
                    </span>
                  </div>

                  {/* Documents inside this shelf */}
                  {docsInThisRak.length === 0 ? (
                    <div className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-5 text-center">
                      <ArchiveIcon className="mb-2 h-5 w-5 text-zinc-300" />
                      <p className="text-sm font-medium text-zinc-500">Rak ini masih kosong</p>
                      <p className="mt-1 text-xs text-zinc-400">Belum ada berkas fisik yang ditempatkan di {rak}.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {docsInThisRak.map((doc) => (
                        <div
                          key={doc.displayKey}
                          className="group flex min-w-0 flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-950/5"
                        >
                          <div>
                            {/* Top Spine: Nomor Berkas & Tahun */}
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[11px] font-bold text-amber-800">
                                {doc.nomorArsip || "No. 01"}
                              </span>
                              <span className="text-[11px] font-medium text-zinc-400">
                                Tahun {doc.tahun || doc.tanggal?.match(/\d{4}/)?.[0] || "—"}
                              </span>
                            </div>

                            {/* Nama Berkas */}
                            <h4 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-zinc-900 transition-colors group-hover:text-violet-700">
                              {doc.name}
                            </h4>

                            {/* Lembaga */}
                            <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-zinc-500">
                              <BuildingIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                              <span className="truncate">{doc.instansi}</span>
                            </div>

                            {/* Nominal */}
                            <p className="mt-3 text-sm font-bold text-zinc-900">
                              {formatRupiah(doc.nominal)}
                            </p>
                          </div>

                          {/* Card Footer: Action */}
                          <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${doc.fileName ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                              {doc.fileName ? "Scan tersedia" : "Fisik saja"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveModalDoc(doc)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                            >
                              <EyeIcon className="h-3.5 w-3.5" />
                              <span>Detail</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {activeModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 shadow-xs">
                  <ArchiveIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    Detail Berkas Arsip Fisik
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {activeModalDoc.lemariArsip === "Dikosongkan"
                      ? "Status: Dikosongkan (Tanpa Lemari Fisik)"
                      : `Posisi: ${activeModalDoc.lemariArsip} • ${activeModalDoc.rakArsip || "Rak 01"}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalDoc(null)}
                aria-label="Tutup detail modal"
                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3.5 overflow-y-auto p-5 text-sm sm:p-6">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  Label Punggung Ordner / Boks Arsip
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-mono text-base font-black text-white shadow-md ${
                      activeModalDoc.lemariArsip === "Dikosongkan"
                        ? "bg-amber-600 shadow-amber-600/25"
                        : "bg-red-600 shadow-red-600/25"
                    }`}
                  >
                    {activeModalDoc.lemariArsip === "Dikosongkan"
                      ? "—"
                      : activeModalDoc.nomorArsip || "No. 01"}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900">{activeModalDoc.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">{activeModalDoc.instansi} &bull; Tahun {activeModalDoc.tahun || activeModalDoc.tanggal?.match(/\d{4}/)?.[0] || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-200/70 bg-white p-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Lemari Arsip</span>
                  <p className="mt-0.5 font-bold text-zinc-800">
                    {activeModalDoc.lemariArsip === "Dikosongkan"
                      ? "Dikosongkan (Tanpa Lemari)"
                      : activeModalDoc.lemariArsip}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200/70 bg-white p-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Posisi Rak</span>
                  <p className="mt-0.5 font-bold text-zinc-800">
                    {activeModalDoc.lemariArsip === "Dikosongkan"
                      ? "— (Dikosongkan)"
                      : activeModalDoc.rakArsip || "Rak 01"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-200/70 bg-white p-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Nominal Hibah</span>
                  <p className="mt-0.5 font-black text-zinc-900 text-sm">
                    {formatRupiah(activeModalDoc.nominal)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200/70 bg-white p-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Bidang Teknis</span>
                  <p className="mt-0.5 font-bold text-zinc-800">
                    Bidang {activeModalDoc.bidangId} ({bidangInfo[activeModalDoc.bidangId].shortName})
                  </p>
                </div>
              </div>

              {activeModalDoc.pic && (
                <div className="rounded-xl border border-zinc-200/70 bg-white p-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Penanggung Jawab / PIC</span>
                  <p className="mt-0.5 font-semibold text-zinc-800">
                    {activeModalDoc.pic} {activeModalDoc.noTelp ? `(${activeModalDoc.noTelp})` : ""}
                  </p>
                </div>
              )}

              {activeModalDoc.catatan && (
                <div className="rounded-xl border border-zinc-200/70 bg-white p-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Catatan Lokasi</span>
                  <p className="mt-0.5 text-zinc-600 italic">{activeModalDoc.catatan}</p>
                </div>
              )}

              {activeModalDoc.fileDataUrl && (
                <div className="mt-2 flex flex-col items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2 truncate">
                    <DocumentIcon className="h-4 w-4 text-amber-700 shrink-0" />
                    <span className="text-xs font-semibold text-amber-900 truncate">
                      {activeModalDoc.fileName || "Scan Berkas"}
                    </span>
                  </div>
                  <a
                    href={activeModalDoc.fileDataUrl}
                    download={activeModalDoc.fileName || "scan-berkas.pdf"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-violet-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    <span>Unduh Scan</span>
                  </a>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex shrink-0 justify-end gap-2 border-t border-zinc-100 bg-zinc-50/70 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 shadow-2xs transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-500/10"
              >
                <span>Cetak Label Rak</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalDoc(null)}
                className="rounded-xl bg-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-700/20 transition hover:bg-violet-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
