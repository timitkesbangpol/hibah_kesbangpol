"use client";

import { useState, useEffect } from "react";
import { useMode, bidangInfo, BidangId } from "@/context/mode-context";
import {
  useHibah,
  ArsipItem,
  LemariArsip,
  LEMARI_OPTIONS,
  RAK_OPTIONS,
} from "@/context/hibah-context";
import StatusBadge, { RetentionBadge, LokasiArsipBadge } from "./status-badge";
import {
  ArchiveIcon,
  CheckCircleIcon,
  DocumentIcon,
  DownloadIcon,
  EyeIcon,
  FileCheckIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "./icons";
import DeleteConfirmModal from "./delete-confirm-modal";
import SearchInput from "./search-input";
import FilterPill from "./filter-pill";
import { TableEmptyRow } from "./empty-state";
import StatCard from "./stat-card";
import { AlokasiLemariField } from "./alokasi-lemari-field";

const jenisList = [
  "Semua",
  "NPHD",
  "Berita Acara",
  "SK Hibah",
  "LPJ Terverifikasi",
  "Proposal & RAB",
];

const lemariFilterList = [
  "Semua",
  "Lemari Arsip 01",
  "Lemari Arsip 02",
  "Lemari Arsip 03",
  "Lemari Arsip 04",
  "Lemari Arsip Khusus",
  "Dikosongkan",
];

const currentYear = new Date().getFullYear();
const tahunList = [
  "Semua",
  "2026",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
];

export default function ArsipTable() {
  const { mode, bidangId } = useMode();
  // Mode Kaban view-only: hanya lihat & unduh, semua aksi ubah data disembunyikan
  const readOnly = mode === "kaban";
  const { arsipList, isLoading, addArsip, updateArsipLokasi, deleteArsip, isOlderThan8Years } = useHibah();

  const [query, setQuery] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("Semua");
  const [selectedLemari, setSelectedLemari] = useState("Semua");
  const [selectedTahun, setSelectedTahun] = useState("Semua");
  const [activeBidangFilter, setActiveBidangFilter] = useState<number | "Semua">(
    mode === "bidang" ? bidangId : "Semua"
  );
  // Auto-hide documents older than 8 years by default
  const [showOlderDocs, setShowOlderDocs] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ArsipItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArsipItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Form New Archive State with Complete Metadata
  const [newKode, setNewKode] = useState(
    `ARS-B${mode === "bidang" ? bidangId : 1}-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [newJudul, setNewJudul] = useState("");
  const [newInstansi, setNewInstansi] = useState("");
  const [newJenis, setNewJenis] = useState<ArsipItem["jenis"]>("NPHD");
  const [newBidang, setNewBidang] = useState<BidangId>(
    mode === "bidang" ? bidangId : 1
  );
  const [newLemari, setNewLemari] = useState<LemariArsip>(
    mode === "bidang"
      ? (`Lemari Arsip 0${bidangId}` as LemariArsip)
      : "Lemari Arsip 01"
  );
  const [newRak, setNewRak] = useState("Rak 01");
  const [newNomor, setNewNomor] = useState("No. 01");
  const [newTahun, setNewTahun] = useState("2026");
  const [newTanggal, setNewTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [newNominal, setNewNominal] = useState("");
  const [newCatatan, setNewCatatan] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when mode/bidangId updates from localStorage
  useEffect(() => {
    if (mode === "bidang") {
      setActiveBidangFilter(bidangId);
      setNewBidang(bidangId);
      setNewLemari(`Lemari Arsip 0${bidangId}` as LemariArsip);
      setNewKode(
        `ARS-B${bidangId}-2026-${Math.floor(100 + Math.random() * 900)}`
      );
    }
  }, [mode, bidangId]);

  // Count older documents (> 8 years)
  const totalOlderDocs = arsipList.filter((item) =>
    isOlderThan8Years(item.tahun || item.tanggal)
  ).length;

  const filteredArsip = arsipList.filter((item) => {
    const isOld = isOlderThan8Years(item.tahun || item.tanggal);
    // Auto-hide documents older than 8 years if toggle is off
    if (!showOlderDocs && isOld) {
      return false;
    }

    // Mode restriction: if in Bidang mode, strictly filter to that specific bidang
    const matchesBidang =
      mode === "bidang"
        ? item.bidangId === bidangId
        : activeBidangFilter === "Semua"
        ? true
        : item.bidangId === activeBidangFilter;

    const matchesJenis =
      selectedJenis === "Semua" || item.jenis === selectedJenis;
    const matchesLemari =
      selectedLemari === "Semua" || item.lemariArsip === selectedLemari;
    const matchesTahun =
      selectedTahun === "Semua" || item.tahun === selectedTahun;
    const matchesQuery =
      item.judul.toLowerCase().includes(query.toLowerCase()) ||
      item.kode.toLowerCase().includes(query.toLowerCase()) ||
      item.instansi.toLowerCase().includes(query.toLowerCase());

    return (
      matchesBidang &&
      matchesJenis &&
      matchesLemari &&
      matchesTahun &&
      matchesQuery
    );
  });

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredArsip.length / ITEMS_PER_PAGE));
  const pagedArsip = filteredArsip.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedJenis, selectedLemari, selectedTahun, activeBidangFilter, showOlderDocs]);

  const handleAddArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudul.trim() || !newInstansi.trim()) return;

    setIsSubmitting(true);
    let fileDataUrl: string | undefined = undefined;
    let fileType: string | undefined = undefined;

    if (selectedFile) {
      fileType = selectedFile.type;
      try {
        fileDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
      } catch (err) {
        console.error("Gagal membaca file:", err);
      }
    }

    const formattedDate = new Date(newTanggal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    await addArsip({
      kode:
        newKode ||
        `ARS-B${newBidang}-${newTahun}-${Math.floor(100 + Math.random() * 900)}`,
      judul: newJudul,
      instansi: newInstansi,
      bidangId: newBidang,
      jenis: newJenis,
      tahun: newTahun,
      tanggal: formattedDate,
      ukuran: selectedFile
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(Math.random() * 4 + 1.5).toFixed(1)} MB`,
      lemariArsip: newLemari,
      rakArsip: newLemari === "Dikosongkan" ? "-" : (newRak || "Rak 01"),
      nomorArsip: newLemari === "Dikosongkan" ? "-" : (newNomor || "No. 01"),
      status: "Aktif",
      nominal: Number(newNominal.replace(/\D/g, "")) || undefined,
      catatan: newCatatan,
      fileName: selectedFile
        ? selectedFile.name
        : `${newJudul.replace(/\s+/g, "_")}.pdf`,
      fileDataUrl,
      fileType,
    });

    setIsSubmitting(false);
    setShowAddModal(false);

    // Reset Form
    setNewJudul("");
    setNewInstansi("");
    setNewNominal("");
    setNewCatatan("");
    setSelectedFile(null);
    setNewKode(
      `ARS-B${newBidang}-2026-${Math.floor(100 + Math.random() * 900)}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Widget */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Dokumen Tampil"
          value={`${filteredArsip.length} Dokumen`}
          sub={
            showOlderDocs
              ? "Semua arsip termasuk > 8 tahun"
              : "Arsip aktif (≤ 8 tahun)"
          }
          icon={ArchiveIcon}
          iconBg="bg-red-50 text-red-600"
          accent="bg-red-500"
        />

        <StatCard
          label="Berkas NPHD & SK"
          value={`${
            filteredArsip.filter(
              (a) => a.jenis === "NPHD" || a.jenis === "SK Hibah"
            ).length
          } NPHD/SK`}
          sub="Tersusun di Lemari Arsip"
          icon={FileCheckIcon}
          iconBg="bg-blue-50 text-blue-600"
          accent="bg-blue-500"
        />

        <StatCard
          label="LPJ Terverifikasi"
          value={`${
            filteredArsip.filter((a) => a.jenis === "LPJ Terverifikasi").length
          } Berkas LPJ`}
          sub="Selesai Pertanggungjawaban"
          icon={CheckCircleIcon}
          iconBg="bg-emerald-50 text-emerald-600"
          accent="bg-emerald-500"
        />

        <StatCard
          label="Penyimpanan Lemari"
          value="5 Lemari"
          sub="Lemari 01 s/d 04 & Khusus"
          icon={DocumentIcon}
          iconBg="bg-purple-50 text-purple-600"
          accent="bg-purple-500"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Filter:
        </span>

        {/* Bidang Filter */}
        {mode === "admin" ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Bidang:</span>
            <select
              value={
                activeBidangFilter === "Semua"
                  ? "Semua"
                  : String(activeBidangFilter)
              }
              onChange={(e) =>
                setActiveBidangFilter(
                  e.target.value === "Semua"
                    ? "Semua"
                    : (Number(e.target.value) as BidangId)
                )
              }
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
            >
              <option value="Semua">Semua Bidang</option>
              {([1, 2, 3, 4] as BidangId[]).map((id) => (
                <option key={id} value={String(id)}>
                  {bidangInfo[id].shortName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Bidang:</span>
            <span
              className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-sm ${bidangInfo[bidangId].color}`}
            >
              Bidang {bidangId}
            </span>
          </div>
        )}

        <div className="h-4 w-px bg-zinc-200 hidden sm:block" />

        {/* Lemari Arsip Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500">Lemari:</span>
          <select
            value={selectedLemari}
            onChange={(e) => setSelectedLemari(e.target.value)}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
          >
            {lemariFilterList.map((l) => (
              <option key={l} value={l}>
                {l === "Semua" ? "Semua Lemari" : l}
              </option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-zinc-200 hidden sm:block" />

        {/* Tahun Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500">Tahun:</span>
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
          >
            {tahunList.map((t) => (
              <option key={t} value={t}>
                {t === "Semua" ? "Semua Tahun" : `T.A. ${t}`}
              </option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-zinc-200 hidden sm:block" />

        {/* Jenis Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500">Jenis:</span>
          <select
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
          >
            {jenisList.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>

        {/* Retention Filter Toggle (> 8 Tahun) */}
        {totalOlderDocs > 0 && (
          <>
            <div className="h-4 w-px bg-zinc-200 hidden sm:block" />
            <button
              onClick={() => setShowOlderDocs(!showOlderDocs)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition border ${
                showOlderDocs
                  ? "border-amber-400 bg-amber-50 text-amber-900 shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
              title="Tampilkan atau sembunyikan arsip lebih dari 8 tahun"
            >
              <ArchiveIcon className="h-3.5 w-3.5 text-amber-600" />
              <span>{showOlderDocs ? "Sembunyikan Arsip > 8 Thn" : `Arsip > 8 Thn (${totalOlderDocs})`}</span>
            </button>
          </>
        )}

        {/* Search & Actions on Right */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Cari kode arsip, judul..."
            className="w-44 sm:w-56"
          />
          {!readOnly && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-red-600 px-3.5 text-xs font-semibold text-white shadow-md shadow-red-600/25 transition hover:bg-red-500 active:scale-[0.98]"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Tambah Arsip</span>
            </button>
          )}
        </div>
      </div>

      {/* Full Main Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/70 text-xs uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Kode Arsip</th>
                <th className="px-5 py-3.5 font-semibold min-w-[200px]">Judul Dokumen</th>
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Lokasi Fisik Arsip</th>
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Bidang</th>
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Jenis</th>
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Tahun / Tgl</th>
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Ukuran</th>
                <th className="px-5 py-3.5 text-left font-semibold whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pagedArsip.map((item) => {
                const isOld = isOlderThan8Years(item.tahun || item.tanggal);
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-zinc-50/80 ${
                      isOld ? "bg-amber-50/30" : ""
                    }`}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-1 rounded">
                        {item.kode}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-zinc-900">
                            {item.judul}
                          </p>
                          {isOld && <RetentionBadge isOlder={true} />}
                        </div>
                        <p className="text-xs text-zinc-500">{item.instansi}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <LokasiArsipBadge
                        lemari={item.lemariArsip}
                        rak={item.rakArsip || "Rak 01"}
                        nomor={item.nomorArsip || "No. 01"}
                        compact={true}
                      />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 ${
                          bidangInfo[item.bidangId].color
                        }`}
                      >
                        Bidang {item.bidangId}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 whitespace-nowrap shrink-0">
                        {item.jenis}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-xs font-semibold text-zinc-800">
                        T.A. {item.tahun}
                      </p>
                      <p className="text-[11px] text-zinc-400">{item.tanggal}</p>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                      {item.ukuran}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-left">
                      <div className="flex items-center justify-start gap-1.5">
                        <button
                          onClick={() => setSelectedDetail(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm whitespace-nowrap shrink-0"
                          title="Lihat Detail & Pratinjau Dokumen"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          <span>Detail</span>
                        </button>

                        {!readOnly && (
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Hapus Arsip dari Database"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center text-sm text-zinc-400"
                  >
                    Memuat berkas arsip dari database...
                  </td>
                </tr>
              ) : filteredArsip.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center text-sm text-zinc-400"
                  >
                    {arsipList.length === 0
                      ? "Belum ada berkas arsip di database. Silakan klik 'Arsipkan Berkas Baru'."
                      : "Tidak ada berkas arsip yang sesuai dengan kriteria pencarian."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-5 py-3 text-xs text-zinc-500 gap-3 flex-wrap">
          <span>
            Menampilkan{" "}
            <strong className="text-zinc-800">{filteredArsip.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</strong>
            {" "}&ndash;{" "}
            <strong className="text-zinc-800">{Math.min(currentPage * ITEMS_PER_PAGE, filteredArsip.length)}</strong>
            {" "}dari{" "}
            <strong className="text-zinc-800">{filteredArsip.length}</strong> berkas arsip
            {!showOlderDocs && totalOlderDocs > 0 && (
              <span className="text-amber-700 font-medium ml-1">
                ({totalOlderDocs} dokumen &gt; 8 tahun disembunyikan)
              </span>
            )}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &lsaquo;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={`el-${idx}`} className="px-1 text-zinc-400">&hellip;</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-lg border px-2 text-xs font-semibold transition ${
                      currentPage === p
                        ? "border-red-500 bg-red-600 text-white shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &rsaquo;
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah Arsip Baru */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex shrink-0 items-start justify-between border-b border-zinc-100 p-6 pb-4">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">
                  Input Berkas Arsip Digital Baru
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tambahkan arsip naskah hibah, berita acara, SK, atau LPJ ke dalam lemari, rak, dan nomor berkas.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddArchive} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-700">
                    Kode Arsip (Auto-Generated)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={newKode}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-mono font-bold text-zinc-600 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-700">
                    Jenis Dokumen Arsip *
                  </label>
                  <select
                    value={newJenis}
                    onChange={(e) =>
                      setNewJenis(e.target.value as ArsipItem["jenis"])
                    }
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-medium outline-none focus:border-red-400"
                  >
                    {jenisList
                      .filter((j) => j !== "Semua")
                      .map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-zinc-700">
                  Judul Berkas Dokumen *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: NPHD Penyelenggaraan Pembinaan Bela Negara & Karakter"
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-700">
                    Instansi / Lembaga Penerima *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: DPD KNPI / Paguyuban Pasundan"
                    value={newInstansi}
                    onChange={(e) => setNewInstansi(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-700">
                    Nilai Anggaran / Hibah (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Rp 150.000.000"
                    value={newNominal}
                    onChange={(e) => setNewNominal(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-400"
                  />
                </div>
              </div>

              {/* Alokasi Lokasi Arsip: Pilihan Diisi / Dikosongkan */}
              <AlokasiLemariField
                lemari={newLemari}
                rak={newRak}
                nomor={newNomor}
                onChangeLemari={setNewLemari}
                onChangeRak={setNewRak}
                onChangeNomor={setNewNomor}
                defaultLemari={
                  mode === "bidang"
                    ? (`Lemari Arsip 0${bidangId}` as LemariArsip)
                    : "Lemari Arsip 01"
                }
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-700">
                    Bidang Pengampu *
                  </label>
                  <select
                    value={newBidang}
                    onChange={(e) => {
                      const id = Number(e.target.value) as BidangId;
                      setNewBidang(id);
                      setNewLemari(`Lemari Arsip 0${id}` as LemariArsip);
                      setNewKode(
                        `ARS-B${id}-${newTahun}-${Math.floor(100 + Math.random() * 900)}`
                      );
                    }}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-medium outline-none focus:border-red-400"
                  >
                    {([1, 2, 3, 4] as BidangId[]).map((id) => (
                      <option key={id} value={id}>
                        Bidang {id} ({bidangInfo[id].shortName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-700">
                    Tahun Anggaran *
                  </label>
                  <select
                    value={newTahun}
                    onChange={(e) => setNewTahun(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-medium outline-none focus:border-red-400"
                  >
                    {tahunList
                      .filter((t) => t !== "Semua")
                      .map((t) => (
                        <option key={t} value={t}>
                          T.A. {t}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Upload File */}
              <div>
                <label className="mb-1 block text-xs font-bold text-zinc-700">
                  Unggah Berkas Fisik / Scan PDF *
                </label>
                <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/60 p-4 text-center hover:border-red-500 hover:bg-red-50/20 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {selectedFile ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <DocumentIcon className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-zinc-900 truncate max-w-xs">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-semibold">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB â€¢
                          Berkas Siap Diarsipkan
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <DocumentIcon className="mx-auto h-7 w-7 text-zinc-400" />
                      <p className="text-xs font-semibold text-zinc-700">
                        Klik atau seret file PDF arsip di sini
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Format PDF, DOCX, atau Gambar Scan TTE Resmi
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/70 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition shadow-2xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/25 hover:from-red-700 hover:to-rose-700 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Berkas ke Lemari Arsip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail & Viewer */}
      {selectedDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between border-b border-zinc-100 p-6 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${
                      bidangInfo[selectedDetail.bidangId].color
                    }`}
                  >
                    Bidang {selectedDetail.bidangId}
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                    {selectedDetail.kode}
                  </span>
                  {isOlderThan8Years(selectedDetail.tahun || selectedDetail.tanggal) && (
                    <RetentionBadge isOlder={true} />
                  )}
                </div>
                <h4 className="text-lg font-bold text-zinc-900">
                  {selectedDetail.judul}
                </h4>
                <p className="text-xs text-zinc-500 font-medium">
                  {selectedDetail.instansi}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-zinc-400 block text-[11px] mb-1">
                    Lokasi Fisik Arsip
                  </span>
                  <LokasiArsipBadge
                    lemari={selectedDetail.lemariArsip}
                    rak={selectedDetail.rakArsip || "Rak 01"}
                    nomor={selectedDetail.nomorArsip || "No. 01"}
                    compact={true}
                  />
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-zinc-400 block text-[11px]">
                    Jenis Arsip
                  </span>
                  <p className="font-bold text-zinc-900 text-sm mt-0.5">
                    {selectedDetail.jenis}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-zinc-400 block text-[11px]">
                    Tahun Anggaran
                  </span>
                  <p className="font-semibold text-zinc-800 mt-0.5">
                    T.A. {selectedDetail.tahun} ({selectedDetail.tanggal})
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-zinc-400 block text-[11px]">
                    Ukuran File
                  </span>
                  <p className="font-semibold text-zinc-800 mt-0.5 font-mono">
                    {selectedDetail.ukuran}
                  </p>
                </div>
              </div>

              {/* Quick Lokasi Switcher Inside Detail — disembunyikan untuk mode kaban (view-only) */}
              {!readOnly && (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-zinc-900 text-xs">Pindahkan Lokasi Fisik Lemari, Rak & Nomor</p>
                    <p className="text-[11px] text-zinc-500">
                      Ubah lokasi penempatan lemari arsip fisik secara instan.
                    </p>
                  </div>

                  {/* Toggle Cepat Diisi vs Dikosongkan */}
                  <div className="flex items-center rounded-xl bg-white p-1 border border-zinc-200/90 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        const targetL = "Lemari Arsip 01";
                        updateArsipLokasi(selectedDetail.id, targetL, "Rak 01", "No. 01");
                        setSelectedDetail({
                          ...selectedDetail,
                          lemariArsip: targetL,
                          rakArsip: "Rak 01",
                          nomorArsip: "No. 01",
                        });
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        selectedDetail.lemariArsip !== "Dikosongkan"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedDetail.lemariArsip !== "Dikosongkan"
                            ? "bg-white"
                            : "bg-emerald-500"
                        }`}
                      />
                      Diisi (Ada Lemari)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateArsipLokasi(selectedDetail.id, "Dikosongkan", "-", "-");
                        setSelectedDetail({
                          ...selectedDetail,
                          lemariArsip: "Dikosongkan",
                          rakArsip: "-",
                          nomorArsip: "-",
                        });
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        selectedDetail.lemariArsip === "Dikosongkan"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedDetail.lemariArsip === "Dikosongkan"
                            ? "bg-white"
                            : "bg-amber-500"
                        }`}
                      />
                      Dikosongkan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] font-bold text-zinc-600 block mb-1">Pilih Lemari:</span>
                    <select
                      value={selectedDetail.lemariArsip}
                      onChange={(e) => {
                        const newL = e.target.value as LemariArsip;
                        const newR =
                          newL === "Dikosongkan"
                            ? "-"
                            : selectedDetail.rakArsip && selectedDetail.rakArsip !== "-"
                            ? selectedDetail.rakArsip
                            : "Rak 01";
                        const newN =
                          newL === "Dikosongkan"
                            ? "-"
                            : selectedDetail.nomorArsip && selectedDetail.nomorArsip !== "-"
                            ? selectedDetail.nomorArsip
                            : "No. 01";
                        updateArsipLokasi(selectedDetail.id, newL, newR, newN);
                        setSelectedDetail({
                          ...selectedDetail,
                          lemariArsip: newL,
                          rakArsip: newR,
                          nomorArsip: newN,
                        });
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-bold outline-none shadow-xs transition ${
                        selectedDetail.lemariArsip === "Dikosongkan"
                          ? "border-amber-200 bg-amber-50/50 text-amber-900"
                          : "border-zinc-200 bg-white text-zinc-800"
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

                  <div>
                    <span className="text-[11px] font-bold text-zinc-600 block mb-1">Pilih Rak:</span>
                    {selectedDetail.lemariArsip === "Dikosongkan" ? (
                      <input
                        type="text"
                        disabled
                        value="— (Dikosongkan)"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-100/80 px-3 py-2 text-xs font-medium text-zinc-400 outline-none cursor-not-allowed shadow-xs"
                      />
                    ) : (
                      <select
                        value={selectedDetail.rakArsip || "Rak 01"}
                        onChange={(e) => {
                          const newR = e.target.value;
                          updateArsipLokasi(
                            selectedDetail.id,
                            selectedDetail.lemariArsip,
                            newR,
                            selectedDetail.nomorArsip || "No. 01"
                          );
                          setSelectedDetail({ ...selectedDetail, rakArsip: newR });
                        }}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-800 outline-none shadow-xs"
                      >
                        {RAK_OPTIONS.map((rak) => (
                          <option key={rak} value={rak}>
                            {rak}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-zinc-600 block mb-1">Nomor Berkas:</span>
                    {selectedDetail.lemariArsip === "Dikosongkan" ? (
                      <input
                        type="text"
                        disabled
                        value="—"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-100/80 px-3 py-2 text-xs font-medium text-zinc-400 outline-none cursor-not-allowed shadow-xs"
                      />
                    ) : (
                      <input
                        type="text"
                        defaultValue={selectedDetail.nomorArsip || "No. 01"}
                        onBlur={(e) => {
                          const newN = e.target.value;
                          updateArsipLokasi(
                            selectedDetail.id,
                            selectedDetail.lemariArsip,
                            selectedDetail.rakArsip || "Rak 01",
                            newN
                          );
                          setSelectedDetail({ ...selectedDetail, nomorArsip: newN });
                        }}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold font-mono text-zinc-900 outline-none shadow-xs"
                        placeholder="No. 01"
                      />
                    )}
                  </div>
                </div>

                {selectedDetail.lemariArsip === "Dikosongkan" && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200/90 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold">
                      ℹ
                    </span>
                    <span>
                      Status lokasi berkas ini saat ini <strong>Dikosongkan</strong> (belum disimpan di rak atau lemari fisik manapun).
                    </span>
                  </div>
                )}
              </div>
              )}

              {/* Document Viewer Inline */}
              <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-zinc-900 shadow-inner">
                <div className="flex items-center justify-between bg-zinc-800 px-4 py-2.5 text-zinc-200 border-b border-zinc-700">
                  <div className="flex items-center gap-2">
                    <DocumentIcon className="h-4 w-4 text-red-400" />
                    <span className="font-semibold text-xs">
                      Pratinjau Berkas Dokumen Arsip
                    </span>
                    <span className="rounded bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">
                      {selectedDetail.fileName || `${selectedDetail.kode}.pdf`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400">
                      {selectedDetail.ukuran}
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-100 p-4 sm:p-6 min-h-[380px] max-h-[480px] overflow-y-auto flex items-center justify-center">
                  {selectedDetail.fileDataUrl ? (
                    selectedDetail.fileType?.startsWith("image/") ? (
                      <div className="max-w-full flex flex-col items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedDetail.fileDataUrl}
                          alt="Pratinjau Dokumen"
                          className="max-h-[420px] rounded-lg shadow-lg object-contain bg-white border border-zinc-200"
                        />
                      </div>
                    ) : (
                      <iframe
                        src={selectedDetail.fileDataUrl}
                        title="Pratinjau Dokumen PDF"
                        className="w-full h-[420px] rounded-lg border border-zinc-300 bg-white shadow"
                      />
                    )
                  ) : (
                    <div className="w-full max-w-2xl rounded-xl bg-white p-6 sm:p-8 shadow-md border border-zinc-200 text-zinc-900 space-y-4 font-serif">
                      <div className="text-center border-b-2 border-zinc-900 pb-4">
                        <p className="text-[11px] uppercase tracking-widest font-sans font-bold text-zinc-700">
                          Pemerintah Kota Bandung
                        </p>
                        <h5 className="text-sm font-bold uppercase tracking-wider font-sans text-zinc-900">
                          Badan Kesatuan Bangsa dan Politik
                        </h5>
                        <p className="text-[10px] font-sans text-zinc-500 italic mt-0.5">
                          Jalan Wastukencana No. 2, Babakan Ciamis, Sumur Bandung, Kota Bandung
                        </p>
                      </div>

                      <div className="text-center py-2">
                        <p className="font-bold text-xs uppercase underline tracking-wide">
                          Arsip Dokumen Bantuan Hibah Daerah
                        </p>
                        <p className="text-[11px] font-sans text-zinc-500 mt-1">
                          Nomor Berkas: {selectedDetail.kode}
                        </p>
                      </div>

                      <div className="space-y-2 text-[11px] leading-relaxed text-zinc-800 font-sans">
                        <p>
                          Telah tersimpan dan terverifikasi secara resmi dalam basis data arsip hibah Bakesbangpol Kota Bandung:
                        </p>
                        <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-1 my-2">
                          <p>
                            <strong>Judul Arsip:</strong> {selectedDetail.judul}
                          </p>
                          <p>
                            <strong>Lembaga Penerima:</strong> {selectedDetail.instansi}
                          </p>
                          <p>
                            <strong>Bidang:</strong> {bidangInfo[selectedDetail.bidangId].fullName}
                          </p>
                          <p>
                            <strong>Jenis Dokumen:</strong> {selectedDetail.jenis}
                          </p>
                          <p>
                            <strong>Lokasi Fisik Arsip:</strong>{" "}
                            <span className="text-red-700 font-bold">
                              {selectedDetail.lemariArsip} &bull; {selectedDetail.rakArsip || "Rak 01"} &bull; {selectedDetail.nomorArsip || "No. 01"}
                            </span>
                          </p>
                          <p>
                            <strong>Tahun Anggaran:</strong> T.A. {selectedDetail.tahun} ({selectedDetail.tanggal})
                          </p>
                          <p>
                            <strong>Status Retensi:</strong> {isOlderThan8Years(selectedDetail.tahun || selectedDetail.tanggal) ? "Arsip Retensi (> 8 Tahun)" : "Arsip Aktif (≤ 8 Tahun)"}
                          </p>
                        </div>
                        <p className="text-zinc-600 text-[10px] italic">
                          Dokumen ini merupakan arsip resmi dan telah melewati proses verifikasi dan validasi digital.
                        </p>
                      </div>

                      <div className="flex justify-between pt-4 text-[10px] font-sans">
                        <div className="text-center">
                          <p>Mengetahui Pemohon,</p>
                          <p className="mt-8 font-bold underline">
                            {selectedDetail.instansi}
                          </p>
                          <p className="text-zinc-400">Ketua / Penanggung Jawab</p>
                        </div>
                        <div className="text-center">
                          <p>Petugas Arsip Bakesbangpol,</p>
                          <div className="my-1 inline-block rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                            TERSIMPAN DI {selectedDetail.lemariArsip.toUpperCase()}
                          </div>
                          <p className="mt-4 font-bold underline">
                            {selectedDetail.lemariArsip} ({selectedDetail.rakArsip || "Rak 01"} - {selectedDetail.nomorArsip || "No. 01"})
                          </p>
                          <p className="text-zinc-400">Unit Kearsipan Kesbangpol</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-zinc-100 bg-zinc-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  alert(
                    `Mengunduh berkas arsip "${selectedDetail.fileName || selectedDetail.judul}"...`
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition shadow-2xs"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                <span>Unduh Dokumen Arsip</span>
              </button>

              <div className="flex items-center gap-2">
                {!readOnly && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(selectedDetail)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                  title="Hapus Arsip dari Database"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  <span>Hapus Arsip</span>
                </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDetail(null)}
                  className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-zinc-900 px-5 py-3.5 text-xs font-semibold text-white shadow-2xl animate-fade-in">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-zinc-400 hover:text-white"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.judul || ""}
        onConfirm={() => {
          if (deleteTarget) {
            deleteArsip(deleteTarget.id);
            showToast(`Arsip "${deleteTarget.judul}" berhasil dihapus dari database.`);
            if (selectedDetail?.id === deleteTarget.id) {
              setSelectedDetail(null);
            }
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}



