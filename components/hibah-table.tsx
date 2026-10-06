"use client";

import { useState, useEffect } from "react";
import { useMode, bidangInfo, BidangId } from "@/context/mode-context";
import { useNotifications } from "@/context/notification-context";
import { useReview } from "@/context/review-context";
import {
  useHibah,
  ProposalItem,
  LemariArsip,
  LEMARI_OPTIONS,
  RAK_OPTIONS,
} from "@/context/hibah-context";
import StatusBadge, { RetentionBadge, LokasiArsipBadge } from "./status-badge";
import {
  ArchiveIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentIcon,
  DownloadIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "./icons";
import DeleteConfirmModal from "./delete-confirm-modal";
import SearchInput from "./search-input";
import { TableEmptyRow } from "./empty-state";
import { formatRupiah } from "@/lib/utils";
import { AlokasiLemariField } from "./alokasi-lemari-field";

const lemariFilterList = [
  "Semua",
  "Lemari Arsip 01",
  "Lemari Arsip 02",
  "Lemari Arsip 03",
  "Lemari Arsip 04",
  "Lemari Arsip Khusus",
  "Dikosongkan",
];

interface PenerimaHibah {
  nama: string;
  bidangId: BidangId;
}

export type FormType = "proposal" | "pencairan" | "lpj";


export default function HibahTable() {
  const { mode, bidangId } = useMode();
  // Mode Kaban view-only: hanya lihat & unduh, semua aksi ubah data disembunyikan
  const readOnly = mode === "kaban";
  const { addNotification } = useNotifications();
  const { submitForReview } = useReview();
  const {
    proposals,
    isLoading,
    addProposal,
    updateProposal,
    updateProposalLokasi,
    deleteProposal,
    isOlderThan8Years,
    isOlderThan5Years,
  } = useHibah();
  const [penerimaHibah, setPenerimaHibah] = useState<PenerimaHibah[]>([]);

  const [query, setQuery] = useState("");
  const [filterLemari, setFilterLemari] = useState("Semua");
  const [filterTahun, setFilterTahun] = useState("Semua");
  const [filterBidang, setFilterBidang] = useState<number | "Semua">(
    mode === "bidang" ? bidangId : "Semua"
  );
  const [filterInstansi, setFilterInstansi] = useState("Semua");
  // Auto-hide documents older than 5 years (permanent â€” only Arsip Hibah can show these)
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFormType, setActiveFormType] = useState<FormType>("proposal");
  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProposalItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editInstansi, setEditInstansi] = useState("");
  const [editKategori, setEditKategori] = useState("");
  const [editNominal, setEditNominal] = useState("");
  const [editLemari, setEditLemari] = useState<LemariArsip>("Lemari Arsip 01");
  const [editRak, setEditRak] = useState("Rak 01");
  const [editNomor, setEditNomor] = useState("No. 01");
  const [editPic, setEditPic] = useState("");
  const [editNoTelp, setEditNoTelp] = useState("");
  const [editCatatan, setEditCatatan] = useState("");

  // Form states for New Proposal
  const [newName, setNewName] = useState("");
  const [newInstansi, setNewInstansi] = useState("");
  const [newBidangId, setNewBidangId] = useState<BidangId>(
    mode === "bidang" ? bidangId : 1
  );
  const [newLemari, setNewLemari] = useState<LemariArsip>(
    mode === "bidang"
      ? (`Lemari Arsip 0${bidangId}` as LemariArsip)
      : "Lemari Arsip 01"
  );
  const [newRak, setNewRak] = useState("Rak 01");
  const [newNomor, setNewNomor] = useState("No. 01");
  const [newKategori, setNewKategori] = useState("Seni Budaya");
  const [newNominal, setNewNominal] = useState("");
  const [newPic, setNewPic] = useState("");
  const [newNoTelp, setNewNoTelp] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync state when mode/bidangId updates from localStorage
  useEffect(() => {
    if (mode === "bidang") {
      setFilterBidang(bidangId);
      setNewBidangId(bidangId);
      setNewLemari(`Lemari Arsip 0${bidangId}` as LemariArsip);
    }
  }, [mode, bidangId]);

  // Read search query from URL parameter if directed from topbar search
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      const tahun = params.get("tahun");
      if (q) setQuery(q);
      if (tahun) setFilterTahun(tahun);
    }
  }, []);

  useEffect(() => {
    const fetchPenerimaHibah = async () => {
      try {
        const res = await fetch("/api/lembaga");
        if (!res.ok) return;
        const json = await res.json();
        setPenerimaHibah(
          (json.data || [])
            .map((row: { Nama_lembaga_ormas?: string; bidang_yang_terkait?: string | number }) => ({
              nama: row.Nama_lembaga_ormas || "",
              bidangId: Number(row.bidang_yang_terkait) as BidangId,
            }))
            .filter(
              (item: PenerimaHibah) =>
                item.nama && [1, 2, 3, 4].includes(item.bidangId)
            )
        );
      } catch (error) {
        console.error("Gagal mengambil daftar penerima hibah:", error);
      }
    };

    fetchPenerimaHibah();
  }, []);

  const bidangUntukFilter = mode === "bidang" ? bidangId : filterBidang;
  const penerimaBidangAktif = Array.from(
    new Set(
      penerimaHibah
        .filter(
          (item) =>
            bidangUntukFilter === "Semua" || item.bidangId === bidangUntukFilter
        )
        .map((item) => item.nama)
    )
  ).sort();
  const filterInstansiAktif = penerimaBidangAktif.includes(filterInstansi)
    ? filterInstansi
    : "Semua";
  const visibleProposals =
    mode === "bidang" ? proposals.filter((p) => p.bidangId === bidangId) : proposals;

  const filtered = proposals.filter((p) => {
    // Hard filter: documents older than 5 years are not shown here
    // They are accessible exclusively via the Arsip Hibah page
    if (isOlderThan5Years(p.tahun || p.tanggal)) return false;

    const matchesQuery =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.instansi.toLowerCase().includes(query.toLowerCase());
    const matchesLemari =
      filterLemari === "Semua" || p.lemariArsip === filterLemari;
    const matchesTahun =
      filterTahun === "Semua" || p.tahun === filterTahun;
    const matchesBidang =
      mode === "bidang"
        ? p.bidangId === bidangId
        : filterBidang === "Semua" || p.bidangId === filterBidang;

    const matchesInstansi =
      mode === "bidang"
        ? filterInstansiAktif === "Semua" || p.instansi === filterInstansiAktif
        : true;
    return matchesQuery && matchesLemari && matchesTahun && matchesBidang && matchesInstansi;
  });

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, filterLemari, filterTahun, filterBidang, filterInstansi]);

  const handleAddProposal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim() || !newInstansi.trim()) return;
    if (activeFormType === "pencairan" && !newNominal.trim()) {
      alert("Mohon masukkan nominal dana pencairan!");
      return;
    }
    if (activeFormType === "lpj" && !newPic.trim()) {
      alert("Mohon masukkan nama penanggung jawab (PIC) LPJ!");
      return;
    }

    setIsSubmitting(true);
    const numericNominal = Number(newNominal.replace(/\D/g, "")) || 0;
    const currentYear = new Date().getFullYear().toString();

    // ── Mode BIDANG: kirim ke antrian review admin ──────────────────────
    if (mode === "bidang") {
      let fileDataUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: string | undefined;
      let fileType: string | undefined;
      if (newFile) {
        fileName = newFile.name;
        fileSize = `${(newFile.size / (1024 * 1024)).toFixed(2)} MB`;
        fileType = newFile.type;
        try {
          fileDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(newFile);
          });
        } catch {}
      }

      const docCategory =
        activeFormType === "pencairan"
          ? "Pencairan Dana"
          : activeFormType === "lpj"
          ? "Laporan Pertanggungjawaban (LPJ)"
          : newKategori;

      submitForReview({
        bidangId: newBidangId,
        bidangNama: bidangInfo[newBidangId].shortName,
        name: newName,
        instansi: newInstansi,
        kategori: docCategory,
        nominal: numericNominal,
        tahun: currentYear,
        lemariArsip: newLemari,
        rakArsip: newLemari === "Dikosongkan" ? "-" : (newRak || "Rak 01"),
        nomorArsip: newLemari === "Dikosongkan" ? "-" : (newNomor || "No. 01"),
        pic: newPic || undefined,
        noTelp: newNoTelp || undefined,
        fileName,
        fileDataUrl,
        fileType,
        fileSize,
      });

      // Notifikasi ke admin (feed Laporan)
      const jenisNama =
        activeFormType === "pencairan"
          ? "pencairan"
          : activeFormType === "lpj"
          ? "LPJ"
          : "usulan";
      addNotification({
        type: "dokumen_masuk",
        bidangId: newBidangId,
        bidangNama: bidangInfo[newBidangId].shortName,
        message: `Dokumen ${jenisNama} baru masuk untuk review: "${newName}" dari ${newInstansi}`,
      });

      setIsSubmitting(false);
      setShowAddModal(false);
      setNewName(""); setNewInstansi(""); setNewNominal(""); setNewPic(""); setNewNoTelp(""); setNewFile(null);
      showToast(
        activeFormType === "pencairan"
          ? `Dokumen pencairan "${newName}" berhasil dikirim ke admin untuk direview.`
          : activeFormType === "lpj"
          ? `Dokumen LPJ "${newName}" berhasil dikirim ke admin untuk direview.`
          : `Dokumen "${newName}" berhasil dikirim ke admin untuk direview.`
      );
      return;
    }

    // ── Mode ADMIN: langsung simpan ke storage ──────────────────────────
    const docCategory =
      activeFormType === "pencairan"
        ? "Pencairan Dana"
        : activeFormType === "lpj"
        ? "Laporan Pertanggungjawaban (LPJ)"
        : newKategori;

    await addProposal({
      name: newName,
      instansi: newInstansi,
      bidangId: newBidangId,
      lemariArsip: newLemari,
      rakArsip: newLemari === "Dikosongkan" ? "-" : (newRak || "Rak 01"),
      nomorArsip: newLemari === "Dikosongkan" ? "-" : (newNomor || "No. 01"),
      kategori: docCategory,
      nominal: numericNominal,
      pic: newPic,
      noTelp: newNoTelp,
      file: newFile,
    });

    const jenisLabel =
      activeFormType === "pencairan"
        ? "pencairan dana"
        : activeFormType === "lpj"
        ? "LPJ"
        : "usulan hibah";
    addNotification({
      type: "hibah",
      bidangId: newBidangId,
      bidangNama: bidangInfo[newBidangId].shortName,
      message: `Dokumen ${jenisLabel} baru: "${newName}" dari ${newInstansi}`,
    });

    setIsSubmitting(false);
    setShowAddModal(false);
    setNewName(""); setNewInstansi(""); setNewNominal(""); setNewPic(""); setNewNoTelp(""); setNewFile(null);
    showToast(
      activeFormType === "pencairan"
        ? `Dokumen pencairan dana berhasil diarsipkan ke ${newLemari}, ${newRak}, ${newNomor}!`
        : activeFormType === "lpj"
        ? `Dokumen LPJ berhasil diarsipkan ke ${newLemari}, ${newRak}, ${newNomor}!`
        : `Dokumen usulan hibah berhasil diarsipkan ke ${newLemari}, ${newRak}, ${newNomor}!`
    );
  };

  const handleChangeLokasi = (
    id: number,
    targetLemari: LemariArsip,
    targetRak: string,
    targetNomor: string,
    proposalName: string
  ) => {
    updateProposalLokasi(id, targetLemari, targetRak, targetNomor);
    showToast(`Lokasi arsip "${proposalName}" diperbarui: ${targetLemari} â€¢ ${targetRak} â€¢ ${targetNomor}.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-zinc-900 px-5 py-3.5 text-xs font-semibold text-white shadow-2xl animate-fade-in">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckCircleIcon className="h-4 w-4" />
          </div>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-zinc-400 hover:text-white"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Hero Banner ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-600 to-rose-600 px-6 py-5 shadow-lg shadow-red-700/25">
        {/* Dekorasi lingkaran */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 right-24 h-28 w-28 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Kiri — judul */}
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/90">
              <DocumentIcon className="h-3 w-3" />
              Arsip Digital Hibah Kesbangpol
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Daftar Dokumen Hibah
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Database seluruh berkas dokumen hibah yang telah diterima dan diarsipkan di Kesbangpol.
            </p>
          </div>

          {/* Kanan — stat cards */}
          <div className="flex items-center gap-3">
            <div className="min-w-[90px] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold tracking-wider text-red-100">Total Berkas</p>
              <p className="text-2xl font-black text-white">
                {visibleProposals.filter((p) => !isOlderThan8Years(p.tahun || p.tanggal)).length}
              </p>
            </div>
            <div className="min-w-[90px] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold tracking-wider text-red-100">Total Nominal</p>
              <p className="text-2xl font-black text-white">
                {(() => {
                  const total = visibleProposals.filter((p) => !isOlderThan8Years(p.tahun || p.tanggal)).reduce((s, p) => s + (p.nominal || 0), 0);
                  if (total >= 1_000_000_000) return `${(total / 1_000_000_000).toFixed(1)} M`;
                  if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(0)} Jt`;
                  return "—";
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Filter:</span>

        {/* Bidang Dropdown (admin) / Penerima Hibah Dropdown (bidang mode) */}
        {mode === "admin" ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Bidang:</span>
            <select
              value={filterBidang === "Semua" ? "Semua" : String(filterBidang)}
              onChange={(e) =>
                setFilterBidang(
                  e.target.value === "Semua" ? "Semua" : (Number(e.target.value) as BidangId)
                )
              }
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
            >
              <option value="Semua">Semua Bidang</option>
              {([1, 2, 3, 4] as BidangId[]).map((id) => (
                <option key={id} value={String(id)}>
                  Bidang {id}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Penerima Hibah:</span>
            <select
              value={filterInstansiAktif}
              onChange={(e) => setFilterInstansi(e.target.value)}
              className="h-9 max-w-[180px] rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
            >
              <option value="Semua">Semua Penerima</option>
              {penerimaBidangAktif.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="h-4 w-px bg-zinc-200 hidden sm:block" />

        {/* Tahun Dokumen Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500">Tahun:</span>
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
          >
            <option value="Semua">Semua Tahun</option>
            {Array.from(new Set(proposals.map((p) => p.tahun).filter(Boolean)))
              .sort((a, b) => Number(b) - Number(a))
              .map((tahun) => (
                <option key={tahun} value={tahun}>
                  {tahun}
                </option>
              ))}
          </select>
        </div>

        {/* Lemari Arsip Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500">Lemari:</span>
          <select
            value={filterLemari}
            onChange={(e) => setFilterLemari(e.target.value)}
            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
          >
            {lemariFilterList.map((s) => (
              <option key={s} value={s}>
                {s === "Semua" ? "Semua Lemari" : s}
              </option>
            ))}
          </select>
        </div>


        </div>

        {/* Search & Actions on Right */}
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Cari nama hibah / instansi..."
            className="w-full sm:w-56"
          />

          <button
            onClick={() => alert("Mengunduh Rekap CSV Hibah Berdasarkan Lemari Arsip...")}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
            title="Export Rekap CSV"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {!readOnly && (
            <button
              type="button"
              onClick={() => {
                setActiveFormType("proposal");
                setShowAddModal(true);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3.5 text-xs font-bold text-white shadow-md shadow-red-600/25 transition hover:from-red-500 hover:to-rose-500 active:scale-[0.98]"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Buat Form Hibah</span>
            </button>
          )}
        </div>
      </div>

      {/* Full Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/70 text-xs uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3.5 font-semibold">Nama Dokumen Hibah</th>
                <th className="px-5 py-3.5 font-semibold">Penerima Hibah</th>
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Tujuan Bidang</th>
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Kategori</th>
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Nominal Hibah</th>
                <th className="px-5 py-3.5 font-semibold whitespace-nowrap">Lokasi Fisik Arsip</th>
                <th className="px-5 py-3.5 text-left font-semibold whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paged.map((p) => {
                return (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-zinc-50/80"
                  >
                    <td className="px-5 py-4 font-semibold text-zinc-900">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-zinc-900">{p.name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-normal text-zinc-400 mt-0.5 whitespace-nowrap">
                        <span>Tahun {p.tahun || p.tanggal}</span>
                        {p.fileName && (
                          <span className="inline-flex items-center gap-1">
                            &bull; <DocumentIcon className="h-3 w-3 text-zinc-400" />
                            {p.fileName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-600 font-medium">{p.instansi}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 ${
                          bidangInfo[p.bidangId].color
                        }`}
                      >
                        Bidang {p.bidangId}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 whitespace-nowrap shrink-0">
                        {p.kategori}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold tabular-nums text-zinc-900 whitespace-nowrap">
                      {formatRupiah(p.nominal)}
                    </td>

                    {/* Lokasi Fisik Arsip */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <LokasiArsipBadge
                        lemari={p.lemariArsip}
                        rak={p.rakArsip || "Rak 01"}
                        nomor={p.nomorArsip || "No. 01"}
                        compact={true}
                      />
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-4 whitespace-nowrap text-left">
                      <div className="flex items-center justify-start gap-1.5">
                        <button
                          onClick={() => setSelectedProposal(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm whitespace-nowrap shrink-0"
                          title="Lihat Detail & Dokumen"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          <span>Detail</span>
                        </button>

                        {!readOnly && (
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Hapus Usulan dari Database"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {isLoading && (
                <TableEmptyRow colSpan={7} message="Memuat data usulan hibah dari database..." />
              )}
              {!isLoading && filtered.length === 0 && (
                <TableEmptyRow
                  colSpan={7}
                  message={
                    proposals.length === 0
                      ? "Belum ada data usulan hibah di database. Silakan klik 'Tambah Usulan Hibah'."
                      : "Tidak ada data usulan hibah yang sesuai kriteria pencarian."
                  }
                />
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-5 py-3 text-xs text-zinc-500 gap-3 flex-wrap">
          <span>
            Menampilkan{" "}
            <strong className="text-zinc-800">{filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</strong>
            {" "}&ndash;{" "}
            <strong className="text-zinc-800">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</strong>
            {" "}dari{" "}
            <strong className="text-zinc-800">{filtered.length}</strong> usulan aktif
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

      {/* ========================================================================= */}
      {/* Modal: Proposal Form / Form Pencairan / Form LPJ */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex shrink-0 items-start justify-between border-b border-zinc-100 p-6 pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">
                  {activeFormType === "proposal" && "Proposal Form"}
                  {activeFormType === "pencairan" && "Form Pencairan"}
                  {activeFormType === "lpj" && "Form LPJ"}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {activeFormType === "proposal" &&
                    "Input data usulan proposal hibah dan alokasi Lemari, Rak, serta Nomor penyimpanan."}
                  {activeFormType === "pencairan" &&
                    "Formulir permohonan pencairan dana hibah dan kelengkapan berkas."}
                  {activeFormType === "lpj" &&
                    "Formulir pelaporan pertanggungjawaban (LPJ) penggunaan dana hibah."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddProposal} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">

                {/* ────────────────────────────────────────────────────────── */}
                {/* 1. TAMPILAN: PROPOSAL FORM                                 */}
                {/* ────────────────────────────────────────────────────────── */}
                {activeFormType === "proposal" && (
                  <>
                    {/* Nama Program / Usulan Kegiatan Hibah */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-700">
                        Nama Program / Usulan Kegiatan Hibah *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Misal: Pelatihan Kader Bela Negara & Wasbang 2026"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>

                    {/* Grid: Lembaga Pemohon & Tujuan Bidang Teknis (menggantikan Nominal Dana) */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-zinc-700">
                          Lembaga / Organisasi Pemohon *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Misal: Paguyuban Seni Budaya Kota"
                          value={newInstansi}
                          onChange={(e) => setNewInstansi(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-zinc-700">
                          Tujuan Bidang Teknis *
                        </label>
                        <select
                          value={newBidangId}
                          onChange={(e) => {
                            const id = Number(e.target.value) as BidangId;
                            setNewBidangId(id);
                            setNewLemari(`Lemari Arsip 0${id}` as LemariArsip);
                          }}
                          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-medium outline-none focus:border-red-400"
                        >
                          {([1, 2, 3, 4] as BidangId[]).map((id) => (
                            <option key={id} value={id}>
                              {bidangInfo[id].shortName} ({bidangInfo[id].fullName})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Alokasi Lemari: Pilihan Diisi / Dikosongkan */}
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

                    {/* Dropdown Pindah Halaman/Form */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-700">
                        Pindah Halaman / Form
                      </label>
                      <div className="relative">
                        <select
                          value={activeFormType}
                          onChange={(e) => setActiveFormType(e.target.value as FormType)}
                          className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 cursor-pointer"
                        >
                          <option value="proposal">Proposal Form</option>
                          <option value="pencairan">Form Pencairan</option>
                          <option value="lpj">Form LPJ</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-400">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ────────────────────────────────────────────────────────── */}
                {/* 2. TAMPILAN: FORM PENCAIRAN                                 */}
                {/* ────────────────────────────────────────────────────────── */}
                {activeFormType === "pencairan" && (
                  <>
                    {/* Bantuan Auto-Isi dari Proposal yang Ada */}
                    {proposals.length > 0 && (
                      <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                            <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            Auto-isi dari daftar proposal terdaftar:
                          </span>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const p = proposals.find((x) => x.id === val);
                              if (p) {
                                setNewName(p.name);
                                setNewInstansi(p.instansi);
                                setNewBidangId(p.bidangId);
                                setNewLemari(p.lemariArsip || "Lemari Arsip 01");
                                setNewRak(p.rakArsip || "Rak 01");
                                setNewNomor(p.nomorArsip || "No. 01");
                                if (p.nominal) {
                                  setNewNominal(p.nominal.toLocaleString("id-ID"));
                                }
                              }
                            }}
                            className="rounded-lg border border-emerald-300 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 outline-none focus:border-emerald-500"
                          >
                            <option value="" disabled>-- Pilih Proposal untuk Auto-Isi --</option>
                            {proposals.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.instansi})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Nama Program / Kegiatan Hibah (Auto-isi dari Proposal) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-zinc-700">
                          Nama Program / Usulan Kegiatan Hibah *
                        </label>
                        {newName && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                            <CheckCircleIcon className="h-3 w-3 text-emerald-600" />
                            Auto-isi dari Proposal
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Misal: Pelatihan Kader Bela Negara & Wasbang 2026"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>

                    {/* Grid: Lembaga Penerima & Tujuan Bidang Teknis (Auto-isi dari Proposal) */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-zinc-700">
                            Lembaga / Organisasi Penerima *
                          </label>
                          {newInstansi && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                              Auto-isi
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Misal: Paguyuban Seni Budaya Kota"
                          value={newInstansi}
                          onChange={(e) => setNewInstansi(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-zinc-700">
                            Tujuan Bidang Teknis *
                          </label>
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                            Auto-isi
                          </span>
                        </div>
                        <select
                          value={newBidangId}
                          onChange={(e) => {
                            const id = Number(e.target.value) as BidangId;
                            setNewBidangId(id);
                            setNewLemari(`Lemari Arsip 0${id}` as LemariArsip);
                          }}
                          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-medium outline-none focus:border-red-400"
                        >
                          {([1, 2, 3, 4] as BidangId[]).map((id) => (
                            <option key={id} value={id}>
                              {bidangInfo[id].shortName} ({bidangInfo[id].fullName})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Textbox Nominal Dana Pencairan (Rp) */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-700">
                        Nominal Dana Pencairan (Rp) *
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-bold text-zinc-400">
                          Rp
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Misal: 120.000.000"
                          value={newNominal}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            const formatted = raw ? Number(raw).toLocaleString("id-ID") : "";
                            setNewNominal(formatted);
                          }}
                          className="w-full rounded-xl border border-zinc-200 pl-10 pr-3.5 py-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                        />
                      </div>
                    </div>

                    {/* Alokasi Lemari: Pilihan Diisi / Dikosongkan */}
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

                    {/* Dropdown Pindah Halaman / Form */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-700">
                        Pindah Halaman / Form
                      </label>
                      <div className="relative">
                        <select
                          value={activeFormType}
                          onChange={(e) => setActiveFormType(e.target.value as FormType)}
                          className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 cursor-pointer"
                        >
                          <option value="proposal">Proposal Form</option>
                          <option value="pencairan">Form Pencairan</option>
                          <option value="lpj">Form LPJ</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-400">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ────────────────────────────────────────────────────────── */}
                {/* 3. TAMPILAN: FORM LPJ                                      */}
                {/* ────────────────────────────────────────────────────────── */}
                {activeFormType === "lpj" && (
                  <>
                    {/* Bantuan Auto-Isi dari Proposal yang Ada */}
                    {proposals.length > 0 && (
                      <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                            <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            Auto-isi dari daftar proposal terdaftar:
                          </span>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const p = proposals.find((x) => x.id === val);
                              if (p) {
                                setNewName(p.name);
                                setNewInstansi(p.instansi);
                                setNewBidangId(p.bidangId);
                                setNewLemari(p.lemariArsip || "Lemari Arsip 01");
                                setNewRak(p.rakArsip || "Rak 01");
                                setNewNomor(p.nomorArsip || "No. 01");
                                if (p.pic) {
                                  setNewPic(p.pic);
                                }
                              }
                            }}
                            className="rounded-lg border border-emerald-300 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 outline-none focus:border-emerald-500"
                          >
                            <option value="" disabled>-- Pilih Proposal untuk Auto-Isi --</option>
                            {proposals.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.instansi})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Nama Program / Kegiatan Hibah (Auto-isi dari Proposal) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-zinc-700">
                          Nama Program / Usulan Kegiatan Hibah *
                        </label>
                        {newName && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                            <CheckCircleIcon className="h-3 w-3 text-emerald-600" />
                            Auto-isi dari Proposal
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Misal: Pelatihan Kader Bela Negara & Wasbang 2026"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>

                    {/* Grid: Lembaga Penerima & Tujuan Bidang Teknis (Auto-isi dari Proposal) */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-zinc-700">
                            Lembaga / Organisasi Penerima *
                          </label>
                          {newInstansi && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                              Auto-isi
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Misal: Paguyuban Seni Budaya Kota"
                          value={newInstansi}
                          onChange={(e) => setNewInstansi(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-zinc-700">
                            Tujuan Bidang Teknis *
                          </label>
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                            Auto-isi
                          </span>
                        </div>
                        <select
                          value={newBidangId}
                          onChange={(e) => {
                            const id = Number(e.target.value) as BidangId;
                            setNewBidangId(id);
                            setNewLemari(`Lemari Arsip 0${id}` as LemariArsip);
                          }}
                          className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-medium outline-none focus:border-red-400"
                        >
                          {([1, 2, 3, 4] as BidangId[]).map((id) => (
                            <option key={id} value={id}>
                              {bidangInfo[id].shortName} ({bidangInfo[id].fullName})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Nama Penanggung Jawab (PIC) */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-700">
                        Nama Penanggung Jawab (PIC) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Misal: Nama Ketua / Bendahara / PIC Kegiatan"
                        value={newPic}
                        onChange={(e) => setNewPic(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>

                    {/* Alokasi Lemari: Pilihan Diisi / Dikosongkan */}
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

                    {/* Dropdown Pindah Halaman / Form */}
                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-700">
                        Pindah Halaman / Form
                      </label>
                      <div className="relative">
                        <select
                          value={activeFormType}
                          onChange={(e) => setActiveFormType(e.target.value as FormType)}
                          className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 cursor-pointer"
                        >
                          <option value="proposal">Proposal Form</option>
                          <option value="pencairan">Form Pencairan</option>
                          <option value="lpj">Form LPJ</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-400">
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ────────────────────────────────────────────────────────── */}
                {/* FORM PALING BAWAH: UPLOAD PDF                              */}
                {/* ────────────────────────────────────────────────────────── */}
                <div className="pt-2">
                  <label className="mb-1 block text-xs font-bold text-zinc-700 flex items-center justify-between">
                    <span>
                      Unggah Dokumen Berkas {activeFormType === "proposal" ? "Proposal" : activeFormType === "pencairan" ? "Pencairan" : "LPJ"} (Format PDF) *
                    </span>
                    <span className="text-[10px] text-red-600 font-semibold uppercase">PDF Only</span>
                  </label>
                  <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/60 p-5 text-center hover:border-red-500 hover:bg-red-50/20 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setNewFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {newFile ? (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                          <DocumentIcon className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-zinc-900 truncate max-w-xs">{newFile.name}</p>
                          <p className="text-[11px] text-red-600 font-semibold">
                            {(newFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Berkas PDF Siap Dipratinjau
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <DocumentIcon className="mx-auto h-7 w-7 text-red-500/70" />
                        <p className="text-xs font-bold text-zinc-800">
                          Pilih file dokumen hibah (Format PDF)
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          Dokumen PDF resmi dapat langsung dipratinjau tanpa perlu diunduh
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Storage Notice untuk Proposal Form, Form Pencairan, & Form LPJ */}
                {(activeFormType === "proposal" || activeFormType === "pencairan" || activeFormType === "lpj") && (
                  <div className={`rounded-xl border p-3 text-xs flex items-center gap-2 ${
                    mode === "bidang"
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-zinc-200 bg-zinc-50/80 text-zinc-700"
                  }`}>
                    <ArchiveIcon className={`h-4 w-4 shrink-0 ${mode === "bidang" ? "text-amber-600" : "text-red-600"}`} />
                    {mode === "bidang" ? (
                      <span>Dokumen akan <strong>dikirim ke admin</strong> untuk direview. Jika disetujui, otomatis tersimpan ke <strong>{newLemari} &bull; {newRak} &bull; {newNomor}</strong>.</span>
                    ) : (
                      <span>Dokumen akan tersimpan di <strong>{newLemari} &bull; {newRak} &bull; {newNomor}</strong> dan terintegrasi otomatis ke sistem arsip digital.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
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
                  {isSubmitting
                    ? (mode === "bidang" ? "Mengirim ke Admin..." : "Menyimpan & Mengarsipkan...")
                    : activeFormType === "proposal"
                    ? (mode === "bidang" ? "Kirim ke Admin untuk Review" : "Simpan & Arsipkan Berkas")
                    : activeFormType === "pencairan"
                    ? "Simpan Dokumen Pencairan"
                    : "Simpan Dokumen LPJ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal: Detail Dokumen & Berkas */}
      {/* ========================================================================= */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between border-b border-zinc-100 p-6 pb-4">
              <div>
                {isEditing ? (
                  <div>
                    <h4 className="text-lg font-bold text-zinc-900">
                      Edit Data Usulan & Lokasi Berkas
                    </h4>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">
                      {selectedProposal.name} &bull; Bidang {selectedProposal.bidangId}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${bidangInfo[selectedProposal.bidangId].color}`}>
                        Bidang {selectedProposal.bidangId} - {bidangInfo[selectedProposal.bidangId].shortName}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                        {selectedProposal.kategori}
                      </span>
                      <RetentionBadge isOlder={isOlderThan5Years(selectedProposal.tahun || selectedProposal.tanggal)} />
                    </div>
                    <h4 className="text-lg font-bold text-zinc-900 line-clamp-1">
                      {selectedProposal.name}
                    </h4>
                    <p className="text-xs text-zinc-500 font-medium">{selectedProposal.instansi}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {mode === "admin" && !isEditing && !readOnly && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditName(selectedProposal.name);
                      setEditInstansi(selectedProposal.instansi);
                      setEditKategori(selectedProposal.kategori);
                      setEditNominal(selectedProposal.nominal.toString());
                      setEditLemari(selectedProposal.lemariArsip);
                      setEditRak(selectedProposal.rakArsip || "Rak 01");
                      setEditNomor(selectedProposal.nomorArsip || "No. 01");
                      setEditPic(selectedProposal.pic || "");
                      setEditNoTelp(selectedProposal.noTelp || "");
                      setEditCatatan(selectedProposal.catatan || "");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
                <button
                  onClick={() => { setSelectedProposal(null); setIsEditing(false); }}
                  className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {isEditing ? (
              /* ---- Form Mode Edit ---- */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const updates = {
                    name: editName,
                    instansi: editInstansi,
                    kategori: editKategori,
                    nominal: parseFloat(editNominal) || selectedProposal.nominal,
                    lemariArsip: editLemari,
                    rakArsip: editLemari === "Dikosongkan" ? "-" : (editRak || "Rak 01"),
                    nomorArsip: editLemari === "Dikosongkan" ? "-" : (editNomor || "No. 01"),
                    pic: editPic,
                    noTelp: editNoTelp,
                    catatan: editCatatan,
                  };
                  updateProposal(selectedProposal.id, updates);
                  setSelectedProposal({ ...selectedProposal, ...updates });
                  setIsEditing(false);
                  showToast("Data & lokasi penyimpanan berhasil diperbarui.");
                }}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Nama Usulan Kegiatan *</label>
                      <input
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Penerima Hibah / Lembaga *</label>
                      <input
                        required
                        value={editInstansi}
                        onChange={(e) => setEditInstansi(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Kategori Kegiatan *</label>
                      <input
                        required
                        value={editKategori}
                        onChange={(e) => setEditKategori(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Nominal Bantuan Hibah (Rp) *</label>
                      <input
                        type="number"
                        required
                        value={editNominal}
                        onChange={(e) => setEditNominal(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>
                  </div>

                  {/* Lokasi Fisik: Pilihan Diisi / Dikosongkan */}
                  <AlokasiLemariField
                    lemari={editLemari}
                    rak={editRak}
                    nomor={editNomor}
                    onChangeLemari={setEditLemari}
                    onChangeRak={setEditRak}
                    onChangeNomor={setEditNomor}
                    defaultLemari="Lemari Arsip 01"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Ketua / Penanggung Jawab (PIC)</label>
                      <input
                        value={editPic}
                        onChange={(e) => setEditPic(e.target.value)}
                        placeholder="Nama PIC"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">No. WhatsApp / Telepon</label>
                      <input
                        value={editNoTelp}
                        onChange={(e) => setEditNoTelp(e.target.value)}
                        placeholder="0812-xxxx-xxxx"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Catatan Dokumen</label>
                    <textarea
                      value={editCatatan}
                      onChange={(e) => setEditCatatan(e.target.value)}
                      rows={2}
                      placeholder="Catatan tambahan ordner atau berkas..."
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10 resize-none"
                    />
                  </div>
                </div>

                {/* Sticky Edit Footer */}
                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/70 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition shadow-2xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/25 hover:from-red-700 hover:to-rose-700 transition active:scale-[0.98]"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            ) : (
              /* ---- Mode View Detail ---- */
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-zinc-400 block text-[11px]">Nominal Hibah</span>
                  <p className="font-bold text-zinc-900 text-sm mt-0.5">{formatRupiah(selectedProposal.nominal)}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-zinc-400 block text-[11px] mb-1">Lokasi Fisik Arsip</span>
                  <LokasiArsipBadge
                    lemari={selectedProposal.lemariArsip}
                    rak={selectedProposal.rakArsip || "Rak 01"}
                    nomor={selectedProposal.nomorArsip || "No. 01"}
                    compact={true}
                  />
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-zinc-400 block text-[11px]">Tahun / Tgl Masuk</span>
                  <p className="font-semibold text-zinc-800 mt-0.5">{selectedProposal.tanggal}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                  <span className="text-zinc-400 block text-[11px]">PIC / Pemohon</span>
                  <p className="font-semibold text-zinc-800 mt-0.5 truncate">{selectedProposal.pic || "Ketua Pengurus"}</p>
                </div>
              </div>

              {/* Quick Lemari & Rak Switcher Inside Detail */}
              {!readOnly && (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-zinc-900 text-xs">Pindahkan Lokasi Fisik Lemari & Rak</p>
                    <p className="text-[11px] text-zinc-500">
                      Ubah lokasi lemari arsip, nomor rak, dan nomor berkas penyimpanan dokumen ini secara instan.
                    </p>
                  </div>

                  {/* Toggle Cepat Diisi vs Dikosongkan */}
                  <div className="flex items-center rounded-xl bg-white p-1 border border-zinc-200/90 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        const targetL = "Lemari Arsip 01";
                        handleChangeLokasi(
                          selectedProposal.id,
                          targetL,
                          "Rak 01",
                          "No. 01",
                          selectedProposal.name
                        );
                        setSelectedProposal({
                          ...selectedProposal,
                          lemariArsip: targetL,
                          rakArsip: "Rak 01",
                          nomorArsip: "No. 01",
                        });
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        selectedProposal.lemariArsip !== "Dikosongkan"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedProposal.lemariArsip !== "Dikosongkan"
                            ? "bg-white"
                            : "bg-emerald-500"
                        }`}
                      />
                      Diisi (Ada Lemari)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleChangeLokasi(
                          selectedProposal.id,
                          "Dikosongkan",
                          "-",
                          "-",
                          selectedProposal.name
                        );
                        setSelectedProposal({
                          ...selectedProposal,
                          lemariArsip: "Dikosongkan",
                          rakArsip: "-",
                          nomorArsip: "-",
                        });
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        selectedProposal.lemariArsip === "Dikosongkan"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedProposal.lemariArsip === "Dikosongkan"
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
                      value={selectedProposal.lemariArsip}
                      onChange={(e) => {
                        const newL = e.target.value as LemariArsip;
                        const newR = newL === "Dikosongkan" ? "-" : (selectedProposal.rakArsip && selectedProposal.rakArsip !== "-" ? selectedProposal.rakArsip : "Rak 01");
                        const newN = newL === "Dikosongkan" ? "-" : (selectedProposal.nomorArsip && selectedProposal.nomorArsip !== "-" ? selectedProposal.nomorArsip : "No. 01");
                        handleChangeLokasi(
                          selectedProposal.id,
                          newL,
                          newR,
                          newN,
                          selectedProposal.name
                        );
                        setSelectedProposal({
                          ...selectedProposal,
                          lemariArsip: newL,
                          rakArsip: newR,
                          nomorArsip: newN,
                        });
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-bold outline-none shadow-xs transition ${
                        selectedProposal.lemariArsip === "Dikosongkan"
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
                    {selectedProposal.lemariArsip === "Dikosongkan" ? (
                      <input
                        type="text"
                        disabled
                        value="— (Dikosongkan)"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-100/80 px-3 py-2 text-xs font-medium text-zinc-400 outline-none cursor-not-allowed shadow-xs"
                      />
                    ) : (
                      <select
                        value={selectedProposal.rakArsip || "Rak 01"}
                        onChange={(e) => {
                          const newR = e.target.value;
                          handleChangeLokasi(
                            selectedProposal.id,
                            selectedProposal.lemariArsip,
                            newR,
                            selectedProposal.nomorArsip || "No. 01",
                            selectedProposal.name
                          );
                          setSelectedProposal({ ...selectedProposal, rakArsip: newR });
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
                    {selectedProposal.lemariArsip === "Dikosongkan" ? (
                      <input
                        type="text"
                        disabled
                        value="—"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-100/80 px-3 py-2 text-xs font-medium text-zinc-400 outline-none cursor-not-allowed shadow-xs"
                      />
                    ) : (
                      <input
                        type="text"
                        defaultValue={selectedProposal.nomorArsip || "No. 01"}
                        onBlur={(e) => {
                          const newN = e.target.value;
                          handleChangeLokasi(
                            selectedProposal.id,
                            selectedProposal.lemariArsip,
                            selectedProposal.rakArsip || "Rak 01",
                            newN,
                            selectedProposal.name
                          );
                          setSelectedProposal({ ...selectedProposal, nomorArsip: newN });
                        }}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold font-mono text-zinc-900 outline-none shadow-xs"
                        placeholder="No. 01"
                      />
                    )}
                  </div>
                </div>

                {selectedProposal.lemariArsip === "Dikosongkan" && (
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
                      Pratinjau Dokumen Naskah Hibah & Berkas
                    </span>
                    <span className="rounded bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">
                      {selectedProposal.fileName || "Naskah_Hibah_Resmi.pdf"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400">
                      {selectedProposal.fileSize || "3.2 MB"}
                    </span>
                  </div>
                </div>

                {/* Document Display Area */}
                <div className="bg-zinc-100 p-4 sm:p-6 min-h-[380px] max-h-[480px] overflow-y-auto flex items-center justify-center">
                  {selectedProposal.fileDataUrl ? (
                    selectedProposal.fileType?.startsWith("image/") ? (
                      /* Image Preview */
                      <div className="max-w-full flex flex-col items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedProposal.fileDataUrl}
                          alt="Pratinjau Dokumen"
                          className="max-h-[420px] rounded-lg shadow-lg object-contain bg-white border border-zinc-200"
                        />
                      </div>
                    ) : (
                      /* PDF / Document Embed */
                      <iframe
                        src={selectedProposal.fileDataUrl}
                        title="Pratinjau Dokumen PDF"
                        className="w-full h-[420px] rounded-lg border border-zinc-300 bg-white shadow"
                      />
                    )
                  ) : (
                    /* Simulated Official Indonesian Government Document Preview for Mock Items */
                    <div className="w-full max-w-2xl rounded-xl bg-white p-6 sm:p-8 shadow-md border border-zinc-200 text-zinc-900 space-y-4 font-serif">
                      {/* Kop Surat Resmi */}
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

                      {/* Judul Naskah */}
                      <div className="text-center py-2">
                        <p className="font-bold text-xs uppercase underline tracking-wide">
                          Arsip Naskah Hibah Daerah
                        </p>
                        <p className="text-[11px] font-sans text-zinc-500 mt-1">
                          Nomor Registrasi: REG-{selectedProposal.bidangId}-{selectedProposal.tahun || "2026"}/0{selectedProposal.id}
                        </p>
                      </div>

                      {/* Isi Naskah */}
                      <div className="space-y-2 text-[11px] leading-relaxed text-zinc-800 font-sans">
                        <p>
                          Dokumen pengarsipan bantuan hibah daerah tercatat pada basis data pengarsipan Bakesbangpol:
                        </p>
                        <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-1 my-2">
                          <p><strong>Nama Usulan:</strong> {selectedProposal.name}</p>
                          <p><strong>Penerima Hibah:</strong> {selectedProposal.instansi}</p>
                          <p><strong>Bidang Pengampu:</strong> {bidangInfo[selectedProposal.bidangId].fullName}</p>
                          <p><strong>Kategori Kegiatan:</strong> {selectedProposal.kategori}</p>
                          <p><strong>Besaran Usulan:</strong> {formatRupiah(selectedProposal.nominal)}</p>
                          <p>
                            <strong>Penempatan Fisik Arsip:</strong>{" "}
                            <span className="text-red-700 font-bold">
                              {selectedProposal.lemariArsip} &bull; {selectedProposal.rakArsip || "Rak 01"} &bull; {selectedProposal.nomorArsip || "No. 01"}
                            </span>
                          </p>
                          <p><strong>Status Retensi:</strong> {isOlderThan8Years(selectedProposal.tahun || selectedProposal.tanggal) ? "Arsip Retensi (> 8 Tahun)" : "Arsip Aktif (≤ 8 Tahun)"}</p>
                        </div>
                        <p className="text-zinc-600 text-[10px] italic">
                          Dokumen ini telah diarsipkan dan tersimpan secara sah ke dalam Sistem Pengarsipan Hibah Digital Bakesbangpol Kota Bandung.
                        </p>
                      </div>

                      {/* Tanda Tangan */}
                      <div className="flex justify-between pt-4 text-[10px] font-sans">
                        <div className="text-center">
                          <p>Pemohon Hibah,</p>
                          <p className="mt-8 font-bold underline">{selectedProposal.pic || selectedProposal.instansi}</p>
                          <p className="text-zinc-400">Ketua / Penanggung Jawab</p>
                        </div>
                        <div className="text-center">
                          <p>Petugas Pengarsip Bakesbangpol,</p>
                          <div className="my-1 inline-block rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                            TERARSIP DIGITAL & FISIK
                          </div>
                          <p className="mt-4 font-bold underline">
                            {selectedProposal.lemariArsip} ({selectedProposal.rakArsip || "Rak 01"} - {selectedProposal.nomorArsip || "No. 01"})
                          </p>
                          <p className="text-zinc-400">Ruang Arsip Bakesbangpol</p>
                        </div>
                      </div>
                    </div>
                  )}
                    </div>
                  </div>
                </div>

                {/* Sticky View Footer */}
                <div className="flex shrink-0 items-center justify-between border-t border-zinc-100 bg-zinc-50/70 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => alert(`Mengunduh dokumen "${selectedProposal.fileName || selectedProposal.name}"...`)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition shadow-2xs"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    <span>Unduh Berkas Asli</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(selectedProposal)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                      title="Hapus Usulan dari Database"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      <span>Hapus Berkas</span>
                    </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setSelectedProposal(null); setIsEditing(false); }}
                      className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.name || ""}
        onConfirm={() => {
          if (deleteTarget) {
            deleteProposal(deleteTarget.id);
            showToast(`Berkas "${deleteTarget.name}" berhasil dihapus dari database.`);
            if (selectedProposal?.id === deleteTarget.id) {
              setSelectedProposal(null);
              setIsEditing(false);
            }
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}


