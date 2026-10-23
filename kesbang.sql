-- ============================================================
-- SCRIPT LENGKAP DATABASE: kesbang
-- Versi: 2.0 (gabungan create + fix)
-- Jalankan SEKALI di phpMyAdmin → pilih database `kesbang` → tab SQL
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ============================================================
-- TABEL: arsip
-- ============================================================
CREATE TABLE IF NOT EXISTS `arsip` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jenis_dokumen_arsip` varchar(255) DEFAULT NULL,
  `judul_berkas_dokumen` varchar(255) DEFAULT NULL,
  `nominal_anggaran` bigint(20) DEFAULT NULL COMMENT 'Nominal dalam Rupiah',
  `lemari_arsip` varchar(255) DEFAULT NULL,
  `posisi_rak` varchar(255) DEFAULT NULL,
  `nomor_berkas_urut` varchar(255) DEFAULT NULL,
  `instansi_penerima` varchar(255) DEFAULT NULL,
  `bidang_pengampu` varchar(255) DEFAULT NULL,
  `tahun_anggaran` varchar(10) DEFAULT NULL,
  `scan_foto` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- TABEL: data_hibah
-- ============================================================
CREATE TABLE IF NOT EXISTS `data_hibah` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jenis_dokumen_arsip` varchar(255) DEFAULT NULL COMMENT 'Diperbaiki: typo dokume → dokumen',
  `nominal_diajukan` bigint(20) DEFAULT NULL COMMENT 'Diperbaiki: varchar → bigint',
  `lembaga` varchar(255) DEFAULT NULL,
  `tujuan_bidang_teknis` varchar(255) DEFAULT NULL,
  `lemari_arsip` varchar(255) DEFAULT NULL,
  `posisi_rak` varchar(255) DEFAULT NULL,
  `nomor_berkas` varchar(255) DEFAULT NULL,
  `kategori_program` varchar(255) DEFAULT NULL,
  `tahun_anggaran` varchar(10) DEFAULT NULL COMMENT 'Ditambahkan: konsisten dengan tabel arsip',
  `status_hibah` enum('Diajukan','Proses Verifikasi','Disetujui','Ditolak') DEFAULT 'Diajukan',
  `nama_penanggung_jawab` varchar(255) DEFAULT NULL,
  `scan_foto` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- TABEL: mitra_kerja
-- ============================================================
CREATE TABLE IF NOT EXISTS `mitra_kerja` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `Nama_lembaga_ormas` varchar(255) DEFAULT NULL,
  `jenis_organisasi` varchar(255) DEFAULT NULL,
  `bidang_yang_terkait` varchar(255) DEFAULT NULL,
  `nama_ketua` varchar(255) DEFAULT NULL,
  `nomor_contact` varchar(50) DEFAULT NULL,
  `alamat_sekretariat` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- TABEL: pengguna (dengan kolom password & audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS `pengguna` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_pengguna` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL DEFAULT '' COMMENT 'Hash bcrypt password',
  `peran` varchar(255) DEFAULT NULL COMMENT 'admin / bidang',
  `status` varchar(255) DEFAULT 'Aktif',
  `jabatan` varchar(255) DEFAULT NULL,
  `foto_profil` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- TABEL: sesi (untuk session/token login)
-- ============================================================
CREATE TABLE IF NOT EXISTS `sesi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pengguna_id` int(11) NOT NULL,
  `token` varchar(512) NOT NULL,
  `bidang_id` tinyint(1) DEFAULT NULL COMMENT '1-4 untuk bidang, NULL untuk admin',
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `expired_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`(255)),
  KEY `pengguna_id` (`pengguna_id`),
  CONSTRAINT `fk_sesi_pengguna` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- TABEL: otp_verifikasi (untuk kode OTP verifikasi 2FA/login)
-- ============================================================
CREATE TABLE IF NOT EXISTS `otp_verifikasi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `expired_at` datetime NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_otp` (`otp_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- DATA AWAL: Akun pengguna default
-- Password semua akun: "password"
-- (hash bcrypt dari string "password")
-- GANTI PASSWORD SETELAH LOGIN PERTAMA!
-- ============================================================
INSERT IGNORE INTO `pengguna` (`nama_pengguna`, `email`, `password`, `peran`, `status`, `jabatan`) VALUES
('Sekre Kesbangpol',     'kesbangplsekre@gmail.com',         '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',    'Aktif', 'Administrator Utama (Sekretariat)'),
('Kaban',                 'kesbangpolkepalabadan@gmail.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kaban',    'Aktif', 'Kepala Badan - Akses Lihat & Unduh'),
('Bidang 1',              'kesbangpolbidang01@gmail.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bidang 1', 'Aktif', 'Staff Verifikator Bidang 1 - Kesatuan Bangsa'),
('Bidang 2',              'kesbangpolbidang02@gmail.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bidang 2', 'Aktif', 'Staff Verifikator Bidang 2 - Politik Dalam Negeri'),
('Bidang 3',              'kesbangpolbidang03@gmail.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bidang 3', 'Aktif', 'Staff Verifikator Bidang 3 - Ketahanan Ekonomi & Sosbud'),
('Bidang 4',              'kesbangpolbidang04@gmail.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bidang 4', 'Aktif', 'Staff Verifikator Bidang 4 - Kewaspadaan Dini');

-- ============================================================
-- DATA CONTOH: arsip
-- ============================================================
INSERT IGNORE INTO `arsip` (`id`, `jenis_dokumen_arsip`, `judul_berkas_dokumen`, `nominal_anggaran`, `lemari_arsip`, `posisi_rak`, `nomor_berkas_urut`, `instansi_penerima`, `bidang_pengampu`, `tahun_anggaran`, `scan_foto`) VALUES
(3, 'Proposal & RAB', 'Proposal & Berkas Hibah: zaid sembriwing', 50000000, 'Lemari Arsip 02', 'Rak 01', 'No. 02', 'pki', '2', '2026', 'RAB_dan_Desain_Kandang_Desa.pdf');

-- ============================================================
-- DATA CONTOH: data_hibah
-- ============================================================
INSERT IGNORE INTO `data_hibah` (`id`, `jenis_dokumen_arsip`, `nominal_diajukan`, `lembaga`, `tujuan_bidang_teknis`, `lemari_arsip`, `posisi_rak`, `nomor_berkas`, `kategori_program`, `tahun_anggaran`, `status_hibah`, `nama_penanggung_jawab`, `scan_foto`) VALUES
(2, 'zaid sembriwing', 50000000, 'pki', '2', 'Lemari Arsip 02', 'Rak 01', 'No. 02', 'Seni Budaya', '2026', 'Diajukan', 'jaya', 'RAB_dan_Desain_Kandang_Desa.pdf');

COMMIT;

-- ============================================================
-- VERIFIKASI: Jalankan query ini untuk cek hasil
-- ============================================================
-- SHOW TABLES;
-- DESCRIBE `pengguna`;
-- DESCRIBE `data_hibah`;
-- SELECT `id`, `nama_pengguna`, `email`, `peran`, `status` FROM `pengguna`;