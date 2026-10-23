"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BidangId } from "./mode-context";
export type LemariArsip =
  | "Lemari Arsip 01"
  | "Lemari Arsip 02"
  | "Lemari Arsip 03"
  | "Lemari Arsip 04"
  | "Lemari Arsip Khusus"
  | "Dikosongkan";

export const LEMARI_OPTIONS: { id: LemariArsip; label: string; bidangId: BidangId | 0; desc: string }[] = [
  { id: "Lemari Arsip 01", label: "Lemari Arsip 01", bidangId: 1, desc: "Ideologi, Wawasan Kebangsaan & Bela Negara" },
  { id: "Lemari Arsip 02", label: "Lemari Arsip 02", bidangId: 2, desc: "Politik Dalam Negeri & Ormas" },
  { id: "Lemari Arsip 03", label: "Lemari Arsip 03", bidangId: 3, desc: "Ketahanan Ekonomi, Sosbud & Agama" },
  { id: "Lemari Arsip 04", label: "Lemari Arsip 04", bidangId: 4, desc: "Kewaspadaan Nasional & Konflik Sosial" },
  { id: "Lemari Arsip Khusus", label: "Lemari Arsip Khusus", bidangId: 0, desc: "Arsip Khusus / Gabungan / Cadangan" },
];

export const RAK_OPTIONS = [
  "Rak 01",
  "Rak 02",
  "Rak 03",
  "Rak 04",
  "Rak 05",
];

export interface ProposalItem {
  id: number;
  name: string;
  instansi: string;
  bidangId: BidangId;
  kategori: string;
  nominal: number;
  tanggal: string;
  tahun: string;
  lemariArsip: LemariArsip;
  rakArsip?: string;
  nomorArsip?: string;
  pic?: string;
  noTelp?: string;
  catatan?: string;
  fileName?: string;
  fileSize?: string;
  fileDataUrl?: string;
  fileType?: string;
  dbId?: number;
}

export interface ArsipItem {
  id: string;
  kode: string;
  judul: string;
  instansi: string;
  bidangId: BidangId;
  jenis: "NPHD" | "Berita Acara" | "SK Hibah" | "LPJ Terverifikasi" | "Proposal & RAB";
  tahun: string;
  tanggal: string;
  ukuran: string;
  lemariArsip: LemariArsip;
  rakArsip?: string;
  nomorArsip?: string;
  status?: "Aktif" | "Permanen" | "Inaktif";
  nominal?: number;
  pic?: string;
  noTelp?: string;
  catatan?: string;
  fileName?: string;
  fileDataUrl?: string;
  fileType?: string;
  dbId?: number;
}

interface HibahContextType {
  proposals: ProposalItem[];
  arsipList: ArsipItem[];
  isLoading: boolean;
  addProposal: (
    proposal: Omit<ProposalItem, "id" | "tanggal" | "tahun" | "lemariArsip" | "rakArsip" | "nomorArsip"> & {
      file?: File | null;
      lemariArsip?: LemariArsip;
      rakArsip?: string;
      nomorArsip?: string;
    }
  ) => Promise<void>;
  updateProposalLemari: (id: number, newLemari: LemariArsip) => void;
  updateProposalLokasi: (id: number, newLemari: LemariArsip, newRak?: string, newNomor?: string) => void;
  updateProposal: (
    id: number,
    updates: Partial<Pick<ProposalItem, "name" | "instansi" | "kategori" | "nominal" | "lemariArsip" | "rakArsip" | "nomorArsip" | "pic" | "noTelp" | "catatan">>
  ) => Promise<void>;
  deleteProposal: (id: number) => Promise<void>;
  addArsip: (arsip: Omit<ArsipItem, "id">) => Promise<void>;
  updateArsipLokasi: (id: string, newLemari: LemariArsip, newRak?: string, newNomor?: string) => void;
  deleteArsip: (id: string) => Promise<void>;
  kosongkanLemari: (targetLemari: LemariArsip) => Promise<void>;
  isOlderThan8Years: (tahunStr: string | number) => boolean;
  isOlderThan5Years: (tahunStr: string | number) => boolean;
  refreshData: () => Promise<void>;
}

const HibahContext = createContext<HibahContextType | undefined>(undefined);

function dbRowToProposal(row: any): ProposalItem {
  const proposalYear = row.tahun_anggaran
    ? String(row.tahun_anggaran)
    : row.created_at
    ? new Date(row.created_at).getFullYear().toString()
    : new Date().getFullYear().toString();

  const formattedDate = row.created_at
    ? new Date(row.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  return {
    id: row.id,
    dbId: row.id,
    name: row.jenis_dokumen_arsip || row.jenis_dokume_arsip || "",
    instansi: row.lembaga || "",
    bidangId: (Number(row.tujuan_bidang_teknis) as BidangId) || 1,
    kategori: row.kategori_program || "Seni Budaya",
    nominal: Number(String(row.nominal_diajukan).replace(/\D/g, "")) || 0,
    tanggal: formattedDate,
    tahun: proposalYear,
    lemariArsip: (row.lemari_arsip as LemariArsip) || "Lemari Arsip 01",
    rakArsip: row.posisi_rak || "Rak 01",
    nomorArsip: row.nomor_berkas || "No. 01",
    pic: row.nama_penanggung_jawab || "",
    fileName: row.scan_foto || undefined,
  };
}

function dbRowToArsip(row: any): ArsipItem {
  const arsipYear = row.tahun_anggaran ? String(row.tahun_anggaran) : new Date().getFullYear().toString();
  const formattedDate = row.created_at
    ? new Date(row.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  return {
    id: `arsip-db-${row.id}`,
    dbId: row.id,
    kode: `ARS-B${row.bidang_pengampu || 1}-${arsipYear}-${row.id}`,
    judul: row.judul_berkas_dokumen || "",
    instansi: row.instansi_penerima || "",
    bidangId: (Number(row.bidang_pengampu) as BidangId) || 1,
    jenis: (row.jenis_dokumen_arsip as ArsipItem["jenis"]) || "NPHD",
    tahun: arsipYear,
    tanggal: formattedDate,
    ukuran: "—",
    lemariArsip: (row.lemari_arsip as LemariArsip) || "Lemari Arsip 01",
    rakArsip: row.posisi_rak || "Rak 01",
    nomorArsip: row.nomor_berkas_urut || "No. 01",
    nominal: row.nominal_anggaran != null ? Number(row.nominal_anggaran) : undefined,
    fileName: row.scan_foto || undefined,
  };
}

export function HibahProvider({ children }: { children: React.ReactNode }) {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [arsipList, setArsipList] = useState<ArsipItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isOlderThan8Years = (tahunStr: string | number) => {
    const currentYear = new Date().getFullYear();
    const docYear = typeof tahunStr === "string" ? parseInt(tahunStr, 10) : tahunStr;
    if (isNaN(docYear)) return false;
    return currentYear - docYear >= 8;
  };
  const isOlderThan5Years = isOlderThan8Years;

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [hibahRes, arsipRes] = await Promise.all([
        fetch("/api/hibah"),
        fetch("/api/arsip"),
      ]);

      if (hibahRes.ok) {
        const hibahJson = await hibahRes.json();
        const mapped: ProposalItem[] = (hibahJson.data || []).map(dbRowToProposal);
        setProposals(mapped);
      }

      if (arsipRes.ok) {
        const arsipJson = await arsipRes.json();
        const mapped: ArsipItem[] = (arsipJson.data || []).map(dbRowToArsip);
        setArsipList(mapped);
      }
    } catch (err) {
      console.error("Gagal mengambil data dari database:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Tambah Proposal Hibah -> Simpan ke data_hibah & arsip di MySQL
  const addProposal = async (
    newP: Omit<ProposalItem, "id" | "tanggal" | "tahun" | "lemariArsip" | "rakArsip" | "nomorArsip"> & {
      file?: File | null;
      lemariArsip?: LemariArsip;
      rakArsip?: string;
      nomorArsip?: string;
    }
  ) => {
    let fileDataUrl: string | undefined = undefined;
    let fileName: string | undefined = undefined;
    let fileSize: string | undefined = undefined;
    let fileType: string | undefined = undefined;

    if (newP.file) {
      fileName = newP.file.name;
      fileSize = `${(newP.file.size / (1024 * 1024)).toFixed(2)} MB`;
      fileType = newP.file.type;

      try {
        fileDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(newP.file as File);
        });
      } catch (err) {
        console.error("Gagal membaca file data URL:", err);
      }
    }

    const defaultLemari: LemariArsip =
      newP.lemariArsip ||
      (newP.bidangId === 1
        ? "Lemari Arsip 01"
        : newP.bidangId === 2
        ? "Lemari Arsip 02"
        : newP.bidangId === 3
        ? "Lemari Arsip 03"
        : "Lemari Arsip 04");

    const defaultRak = newP.rakArsip || "Rak 01";
    const defaultNomor = newP.nomorArsip || `No. ${String(Math.floor(1 + Math.random() * 30)).padStart(2, "0")}`;
    const currentYear = new Date().getFullYear().toString();

    try {
      const res = await fetch("/api/hibah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenis_dokumen_arsip: newP.name,
          jenis_dokume_arsip: newP.name,
          nominal_diajukan: String(newP.nominal),
          lembaga: newP.instansi,
          tujuan_bidang_teknis: String(newP.bidangId),
          lemari_arsip: defaultLemari,
          posisi_rak: defaultRak,
          nomor_berkas: defaultNomor,
          kategori_program: newP.kategori,
          nama_penanggung_jawab: newP.pic || null,
          scan_foto: fileName || null,
          tahun_anggaran: currentYear,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const dbId = json.id;

        const created: ProposalItem = {
          id: dbId,
          dbId,
          name: newP.name,
          instansi: newP.instansi,
          bidangId: newP.bidangId,
          kategori: newP.kategori,
          nominal: newP.nominal,
          tanggal: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
          tahun: currentYear,
          lemariArsip: defaultLemari,
          rakArsip: defaultRak,
          nomorArsip: defaultNomor,
          pic: newP.pic,
          noTelp: newP.noTelp,
          catatan: newP.catatan,
          fileName,
          fileSize: fileSize || "—",
          fileDataUrl,
          fileType,
        };
        setProposals((prev) => [created, ...prev]);

        // Simpan juga ke arsip digital
        const arsipRes = await fetch("/api/arsip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jenis_dokumen_arsip: "Proposal & RAB",
            judul_berkas_dokumen: `Proposal & Berkas Hibah: ${newP.name}`,
            nominal_anggaran: newP.nominal,
            lemari_arsip: defaultLemari,
            posisi_rak: defaultRak,
            nomor_berkas_urut: defaultNomor,
            instansi_penerima: newP.instansi,
            bidang_pengampu: String(newP.bidangId),
            tahun_anggaran: currentYear,
            scan_foto: fileName || null,
          }),
        });

        if (arsipRes.ok) {
          const arsipJson = await arsipRes.json();
          const newArsipItem: ArsipItem = {
            id: `arsip-db-${arsipJson.id}`,
            dbId: arsipJson.id,
            kode: `ARS-B${newP.bidangId}-${currentYear}-${arsipJson.id}`,
            judul: `Proposal & Berkas Hibah: ${newP.name}`,
            instansi: newP.instansi,
            bidangId: newP.bidangId,
            jenis: "Proposal & RAB",
            tahun: currentYear,
            tanggal: created.tanggal,
            ukuran: fileSize || "—",
            lemariArsip: defaultLemari,
            rakArsip: defaultRak,
            nomorArsip: defaultNomor,
            nominal: newP.nominal,
            pic: newP.pic,
            noTelp: newP.noTelp,
            fileName: fileName || `Proposal_${newP.name.replace(/\s+/g, "_")}.pdf`,
            fileDataUrl,
            fileType,
          };
          setArsipList((arsipPrev) => [newArsipItem, ...arsipPrev]);
        }
      }
    } catch (err) {
      console.error("Error simpan proposal:", err);
    }
  };

  const updateProposalLokasi = (
    id: number,
    newLemari: LemariArsip,
    newRak?: string,
    newNomor?: string
  ) => {
    setProposals((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            lemariArsip: newLemari,
            ...(newRak !== undefined ? { rakArsip: newRak } : {}),
            ...(newNomor !== undefined ? { nomorArsip: newNomor } : {}),
          };
        }
        return item;
      })
    );

    const proposal = proposals.find((p) => p.id === id);
    if (proposal) {
      fetch("/api/hibah", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: proposal.dbId || id,
          lemari_arsip: newLemari,
          posisi_rak: newRak || proposal.rakArsip,
          nomor_berkas: newNomor || proposal.nomorArsip,
          jenis_dokumen_arsip: proposal.name,
          jenis_dokume_arsip: proposal.name,
          nominal_diajukan: String(proposal.nominal),
          lembaga: proposal.instansi,
          tujuan_bidang_teknis: String(proposal.bidangId),
          kategori_program: proposal.kategori,
          nama_penanggung_jawab: proposal.pic,
          tahun_anggaran: proposal.tahun,
        }),
      }).catch((err) => console.error("Gagal update lokasi hibah:", err));
    }
  };

  const updateProposalLemari = (id: number, newLemari: LemariArsip) => {
    updateProposalLokasi(id, newLemari);
  };

  const updateProposal = async (
    id: number,
    updates: Partial<Pick<ProposalItem, "name" | "instansi" | "kategori" | "nominal" | "lemariArsip" | "rakArsip" | "nomorArsip" | "pic" | "noTelp" | "catatan">>
  ) => {
    setProposals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );

    const proposal = proposals.find((p) => p.id === id);
    if (proposal) {
      const merged = { ...proposal, ...updates };
      try {
        await fetch("/api/hibah", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: merged.dbId || id,
            jenis_dokumen_arsip: merged.name,
            jenis_dokume_arsip: merged.name,
            nominal_diajukan: String(merged.nominal),
            lembaga: merged.instansi,
            tujuan_bidang_teknis: String(merged.bidangId),
            lemari_arsip: merged.lemariArsip,
            posisi_rak: merged.rakArsip,
            nomor_berkas: merged.nomorArsip,
            kategori_program: merged.kategori,
            nama_penanggung_jawab: merged.pic,
            tahun_anggaran: merged.tahun,
          }),
        });
      } catch (err) {
        console.error("Gagal update hibah ke DB:", err);
      }
    }
  };

  // Hapus proposal dari tabel data_hibah di MySQL
  const deleteProposal = async (id: number) => {
    const proposal = proposals.find((p) => p.id === id);
    const dbId = proposal?.dbId || id;

    setProposals((prev) => prev.filter((p) => p.id !== id));

    try {
      await fetch(`/api/hibah?id=${dbId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Gagal hapus hibah dari DB:", err);
    }
  };

  // Tambah arsip mandiri ke tabel arsip di MySQL
  const addArsip = async (newItem: Omit<ArsipItem, "id">) => {
    try {
      const res = await fetch("/api/arsip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenis_dokumen_arsip: newItem.jenis,
          judul_berkas_dokumen: newItem.judul,
          nominal_anggaran: newItem.nominal || null,
          lemari_arsip: newItem.lemariArsip,
          posisi_rak: newItem.rakArsip || null,
          nomor_berkas_urut: newItem.nomorArsip || null,
          instansi_penerima: newItem.instansi,
          bidang_pengampu: String(newItem.bidangId),
          tahun_anggaran: newItem.tahun,
          scan_foto: newItem.fileName || null,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const created: ArsipItem = {
          ...newItem,
          id: `arsip-db-${json.id}`,
          dbId: json.id,
        };
        setArsipList((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error("Gagal simpan arsip ke DB:", err);
    }
  };

  const updateArsipLokasi = (
    id: string,
    newLemari: LemariArsip,
    newRak?: string,
    newNomor?: string
  ) => {
    setArsipList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            lemariArsip: newLemari,
            ...(newRak !== undefined ? { rakArsip: newRak } : {}),
            ...(newNomor !== undefined ? { nomorArsip: newNomor } : {}),
          };
        }
        return item;
      })
    );

    const arsip = arsipList.find((a) => a.id === id);
    if (arsip?.dbId) {
      fetch("/api/arsip", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: arsip.dbId,
          lemari_arsip: newLemari,
          posisi_rak: newRak,
          nomor_berkas_urut: newNomor,
          jenis_dokumen_arsip: arsip.jenis,
          judul_berkas_dokumen: arsip.judul,
          nominal_anggaran: arsip.nominal,
          instansi_penerima: arsip.instansi,
          bidang_pengampu: String(arsip.bidangId),
          tahun_anggaran: arsip.tahun,
        }),
      }).catch((err) => console.error("Gagal update lokasi arsip:", err));
    }
  };

  // Hapus arsip dari tabel arsip di MySQL
  const deleteArsip = async (id: string) => {
    const arsip = arsipList.find((a) => a.id === id);
    const dbId = arsip?.dbId || parseInt(id.replace(/\D/g, ""), 10);

    setArsipList((prev) => prev.filter((a) => a.id !== id));

    if (dbId && !isNaN(dbId)) {
      try {
        await fetch(`/api/arsip?id=${dbId}`, { method: "DELETE" });
      } catch (err) {
        console.error("Gagal hapus arsip dari DB:", err);
      }
    }
  };

  const kosongkanLemari = async (targetLemari: LemariArsip) => {
    setProposals((prev) =>
      prev.map((item) =>
        item.lemariArsip === targetLemari
          ? { ...item, lemariArsip: "Dikosongkan", rakArsip: "-", nomorArsip: "-" }
          : item
      )
    );
    setArsipList((prev) =>
      prev.map((item) =>
        item.lemariArsip === targetLemari
          ? { ...item, lemariArsip: "Dikosongkan", rakArsip: "-", nomorArsip: "-" }
          : item
      )
    );

    const targetProposals = proposals.filter((p) => p.lemariArsip === targetLemari);
    for (const p of targetProposals) {
      fetch("/api/hibah", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: p.dbId || p.id,
          lemari_arsip: "Dikosongkan",
          posisi_rak: "-",
          nomor_berkas: "-",
          jenis_dokumen_arsip: p.name,
          jenis_dokume_arsip: p.name,
          nominal_diajukan: String(p.nominal),
          lembaga: p.instansi,
          tujuan_bidang_teknis: String(p.bidangId),
          kategori_program: p.kategori,
          nama_penanggung_jawab: p.pic,
          tahun_anggaran: p.tahun,
        }),
      }).catch((err) => console.error("Gagal kosongkan lemari proposal:", err));
    }

    const targetArsip = arsipList.filter((a) => a.lemariArsip === targetLemari);
    for (const a of targetArsip) {
      if (a.dbId) {
        fetch("/api/arsip", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: a.dbId,
            lemari_arsip: "Dikosongkan",
            posisi_rak: "-",
            nomor_berkas_urut: "-",
            jenis_dokumen_arsip: a.jenis,
            judul_berkas_dokumen: a.judul,
            nominal_anggaran: a.nominal,
            instansi_penerima: a.instansi,
            bidang_pengampu: String(a.bidangId),
            tahun_anggaran: a.tahun,
          }),
        }).catch((err) => console.error("Gagal kosongkan lemari arsip:", err));
      }
    }
  };

  return (
    <HibahContext.Provider
      value={{
        proposals,
        arsipList,
        isLoading,
        addProposal,
        updateProposalLemari,
        updateProposalLokasi,
        updateProposal,
        deleteProposal,
        addArsip,
        updateArsipLokasi,
        deleteArsip,
        kosongkanLemari,
        isOlderThan8Years,
        isOlderThan5Years,
        refreshData,
      }}
    >
      {children}
    </HibahContext.Provider>
  );
}

export function useHibah() {
  const context = useContext(HibahContext);
  if (!context) {
    throw new Error("useHibah must be used within a HibahProvider");
  }
  return context;
}
