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
  CheckCircleIcon,
  ChevronRightIcon,
  DocumentIcon,
  DownloadIcon,
  EyeIcon,
  FolderIcon,
  MoneyIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from "./icons";

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
    <div className="space-y-6">
      {/* ── Banner Header (Tema Merah & Putih Kesbangpol) ─────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-6 text-white shadow-xl shadow-red-600/15">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              <ArchiveIcon className="h-3.5 w-3.5 text-white" />
              <span>Gudang Penyimpanan Fisik Kesbangpol</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Denah Lemari & Rak Arsip Fisik
            </h1>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl leading-relaxed">
              Pemetaan visual posisi ordner dokumen hibah pada 5 lemari dan rak fisik di ruang arsip.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold tracking-wider text-red-100">Total Berkas</p>
              <p className="text-2xl font-black text-white">{allDocs.length}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold tracking-wider text-red-100">Lemari Aktif</p>
              <p className="text-2xl font-black text-white">5 Unit</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid 5 Lemari Cards (Selector) ───────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
            Pilih Lemari Penyimpanan
          </h2>
          <span className="text-xs text-zinc-400">
            Klik lemari untuk melihat isi rak fisik
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
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
                className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                  isSelected
                    ? `border-red-500 bg-white shadow-lg ring-2 ring-red-500/20 scale-[1.02]`
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm shadow-xs ${
                        isSelected ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      <ArchiveIcon className="h-5 w-5" />
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${details.bgBadge}`}
                    >
                      {details.bidang}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-zinc-900 leading-snug">
                    {lem.label}
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {details.deskripsi}
                  </p>
                </div>

                <div className="mt-4 border-t border-zinc-100 pt-3 flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-zinc-500">Isi Berkas:</span>
                  <span className="text-sm font-black text-zinc-900">
                    {stats.count} Dokumen
                  </span>
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
                className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                  isKosongSelected
                    ? "border-amber-500 bg-amber-50/20 shadow-lg ring-2 ring-amber-500/20 scale-[1.02]"
                    : "border-dashed border-zinc-300 bg-zinc-50/50 hover:border-zinc-400 hover:bg-white hover:shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm shadow-xs ${
                        isKosongSelected ? "bg-amber-600 text-white" : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      <ArchiveIcon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Tanpa Lemari
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-zinc-900 leading-snug">
                    Dikosongkan
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                    Berkas belum dialokasikan ke lemari fisik
                  </p>
                </div>

                <div className="mt-4 border-t border-zinc-200/60 pt-3 flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-zinc-500">Isi Berkas:</span>
                  <span className="text-sm font-black text-amber-700">
                    {kStats.count} Dokumen
                  </span>
                </div>
              </button>
            );
          })()}
        </div>
      </div>

      {/* ── Detail Lemari yang Dipilih & Rak Explorer ────────────────── */}
      <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {/* Lemari Selected Header Bar */}
        <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/25">
              <ArchiveIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-zinc-900">{currentInfo.title}</h2>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${currentInfo.bgBadge}`}>
                  {currentInfo.bidang}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{currentInfo.deskripsi}</p>
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
                className="inline-flex items-center gap-1.5 h-10 rounded-xl border border-amber-300 bg-amber-50 px-3.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
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
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none transition focus:border-red-500"
              >
                <option value="Semua">Semua Rak (Rak 01 - 05)</option>
                {RAK_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  selectedLemari === "Dikosongkan"
                    ? "Cari berkas tanpa lemari..."
                    : "Cari berkas di lemari ini..."
                }
                className="h-10 w-52 sm:w-60 rounded-xl border border-zinc-200 bg-white pl-9 pr-4 text-xs outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
              />
            </div>
          </div>
        </div>

        {/* Rak Physical Shelving Layout / Dikosongkan Layout */}
        <div className="p-5 sm:p-6 space-y-6">
          {selectedLemari === "Dikosongkan" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.displayKey}
                      className="group relative flex flex-col justify-between rounded-xl border border-amber-200/80 bg-white p-3.5 shadow-xs transition hover:border-amber-400 hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                            Dikosongkan
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400">
                            Tahun {doc.tahun || doc.tanggal?.match(/\d{4}/)?.[0] || "—"}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-zinc-900 leading-snug line-clamp-2">
                          {doc.name}
                        </h4>

                        <div className="mt-2 flex items-center gap-1 text-[11px] text-zinc-500 truncate">
                          <BuildingIcon className="h-3 w-3 shrink-0 text-zinc-400" />
                          <span className="truncate">{doc.instansi}</span>
                        </div>

                        <p className="mt-1.5 text-xs font-bold text-zinc-900">
                          {formatRupiah(doc.nominal)}
                        </p>
                      </div>

                      <div className="mt-3 border-t border-zinc-100 pt-2.5 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-zinc-400">
                          {doc.fileName ? "Scan Tersedia" : "Fisik Only"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveModalDoc(doc)}
                          className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-700 transition hover:bg-zinc-200"
                        >
                          <EyeIcon className="h-3 w-3" />
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
                  className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 sm:p-5 transition hover:border-zinc-300"
                >
                  {/* Shelf Header */}
                  <div className="mb-3 flex items-center justify-between border-b border-zinc-200/80 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white font-mono text-xs font-black shadow-xs">
                        {rak.replace("Rak ", "R")}
                      </span>
                      <h3 className="text-sm font-bold text-zinc-800">{rak}</h3>
                      <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
                        {docsInThisRak.length} Ordner Tersimpan
                      </span>
                    </div>

                    <span className="text-[11px] text-zinc-400 font-medium">
                      {selectedLemari} &bull; {rak}
                    </span>
                  </div>

                  {/* Documents inside this shelf */}
                  {docsInThisRak.length === 0 ? (
                    <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white/60 text-xs text-zinc-400">
                      Belum ada berkas fisik yang ditempatkan di {rak}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {docsInThisRak.map((doc) => (
                        <div
                          key={doc.displayKey}
                          className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs transition hover:border-red-300 hover:shadow-md hover:-translate-y-0.5"
                        >
                          <div>
                            {/* Top Spine: Nomor Berkas & Tahun */}
                            <div className="flex items-center justify-between gap-1.5 mb-2">
                              <span className="inline-flex items-center gap-1 rounded-md bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 font-mono text-[10px] font-bold shadow-xs">
                                {doc.nomorArsip || "No. 01"}
                              </span>
                              <span className="text-[10px] font-bold text-zinc-400">
                                Tahun {doc.tahun || doc.tanggal?.match(/\d{4}/)?.[0] || "—"}
                              </span>
                            </div>

                            {/* Nama Berkas */}
                            <h4 className="text-xs font-bold text-zinc-900 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                              {doc.name}
                            </h4>

                            {/* Lembaga */}
                            <div className="mt-2 flex items-center gap-1 text-[11px] text-zinc-500 truncate">
                              <BuildingIcon className="h-3 w-3 shrink-0 text-zinc-400" />
                              <span className="truncate">{doc.instansi}</span>
                            </div>

                            {/* Nominal */}
                            <p className="mt-1.5 text-xs font-bold text-zinc-900">
                              {formatRupiah(doc.nominal)}
                            </p>
                          </div>

                          {/* Card Footer: Action */}
                          <div className="mt-3 border-t border-zinc-100 pt-2.5 flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-zinc-400">
                              {doc.fileName ? "Scan Tersedia" : "Fisik Only"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveModalDoc(doc)}
                              className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-700 transition hover:bg-red-50 hover:text-red-700"
                            >
                              <EyeIcon className="h-3 w-3" />
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
      </div>

      {/* ── Modal Detail Dokumen Fisik ───────────────────────────────── */}
      {activeModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-xs">
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

            {/* Body Info */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5 text-xs">
              {/* Box Label Ordner Preview */}
              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-r from-zinc-50 to-white p-4">
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
                  <div>
                    <p className="font-bold text-zinc-900 text-sm">{activeModalDoc.name}</p>
                    <p className="text-zinc-500">{activeModalDoc.instansi} &bull; Tahun {activeModalDoc.tahun || activeModalDoc.tanggal?.match(/\d{4}/)?.[0] || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Lemari Arsip</span>
                  <p className="mt-0.5 font-bold text-zinc-800">
                    {activeModalDoc.lemariArsip === "Dikosongkan"
                      ? "Dikosongkan (Tanpa Lemari)"
                      : activeModalDoc.lemariArsip}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Posisi Rak</span>
                  <p className="mt-0.5 font-bold text-zinc-800">
                    {activeModalDoc.lemariArsip === "Dikosongkan"
                      ? "— (Dikosongkan)"
                      : activeModalDoc.rakArsip || "Rak 01"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Nominal Hibah</span>
                  <p className="mt-0.5 font-black text-zinc-900 text-sm">
                    {formatRupiah(activeModalDoc.nominal)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Bidang Teknis</span>
                  <p className="mt-0.5 font-bold text-zinc-800">
                    Bidang {activeModalDoc.bidangId} ({bidangInfo[activeModalDoc.bidangId].shortName})
                  </p>
                </div>
              </div>

              {activeModalDoc.pic && (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Penanggung Jawab / PIC</span>
                  <p className="mt-0.5 font-semibold text-zinc-800">
                    {activeModalDoc.pic} {activeModalDoc.noTelp ? `(${activeModalDoc.noTelp})` : ""}
                  </p>
                </div>
              )}

              {activeModalDoc.catatan && (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Catatan Lokasi</span>
                  <p className="mt-0.5 text-zinc-600 italic">{activeModalDoc.catatan}</p>
                </div>
              )}

              {activeModalDoc.fileDataUrl && (
                <div className="mt-2 flex items-center justify-between rounded-xl border border-red-200 bg-red-50/50 p-3">
                  <div className="flex items-center gap-2 truncate">
                    <DocumentIcon className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="text-xs font-semibold text-red-900 truncate">
                      {activeModalDoc.fileName || "Scan Berkas"}
                    </span>
                  </div>
                  <a
                    href={activeModalDoc.fileDataUrl}
                    download={activeModalDoc.fileName || "scan-berkas.pdf"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-500 transition"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    <span>Unduh Scan</span>
                  </a>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex shrink-0 justify-end gap-2 border-t border-zinc-100 bg-zinc-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition shadow-2xs"
              >
                <span>Cetak Label Rak</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalDoc(null)}
                className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-500 shadow-md shadow-red-600/20 transition"
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
