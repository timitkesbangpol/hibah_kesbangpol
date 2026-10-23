import crypto from "crypto";
import pool from "./db";

// Fallback in-memory store jika database MySQL sedang tidak aktif
interface MemoryOtp {
  code: string;
  expiredAt: number;
}
const memoryOtpStore = new Map<string, MemoryOtp>();

let tableEnsured = false;

/**
 * Memastikan tabel `otp_verifikasi` siap di database MySQL
 */
async function ensureOtpTable() {
  if (tableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`otp_verifikasi\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT,
        \`email\` VARCHAR(255) NOT NULL,
        \`otp_code\` VARCHAR(10) NOT NULL,
        \`expired_at\` DATETIME NOT NULL,
        \`is_used\` TINYINT(1) DEFAULT 0,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_email\` (\`email\`),
        KEY \`idx_otp\` (\`otp_code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    tableEnsured = true;
  } catch (err) {
    console.warn("Peringatan: Gagal auto-create tabel otp_verifikasi di DB (menggunakan fallback in-memory):", err);
  }
}

/**
 * Generate 6-digit angka acak untuk kode OTP
 */
export function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Menyimpan kode OTP baru untuk email tertentu (berlaku selama N menit)
 */
export async function createAndSaveOtp(email: string, durationMinutes = 5): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const otpCode = generateOtpCode();
  const expiredAtMs = Date.now() + durationMinutes * 60 * 1000;
  const expiredAtDate = new Date(expiredAtMs);

  // Simpan ke memory store sebagai fallback
  memoryOtpStore.set(normalizedEmail, {
    code: otpCode,
    expiredAt: expiredAtMs,
  });

  try {
    await ensureOtpTable();
    // Non-aktifkan kode OTP lama untuk email ini
    await pool.query(
      "UPDATE `otp_verifikasi` SET `is_used` = 1 WHERE `email` = ? AND `is_used` = 0",
      [normalizedEmail]
    );

    // Simpan kode OTP baru
    await pool.query(
      "INSERT INTO `otp_verifikasi` (`email`, `otp_code`, `expired_at`, `is_used`) VALUES (?, ?, ?, 0)",
      [normalizedEmail, otpCode, expiredAtDate]
    );
  } catch (err) {
    console.warn("DB tidak merespons, OTP tetap tersimpan di memori cache:", err);
  }

  return otpCode;
}

/**
 * Validasi kode OTP yang dimasukkan user
 */
export async function verifyOtpCode(
  email: string,
  code: string
): Promise<{ valid: boolean; reason?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  if (!trimmedCode || trimmedCode.length !== 6) {
    return { valid: false, reason: "Kode OTP harus terdiri dari 6 digit angka." };
  }

  try {
    await ensureOtpTable();
    const [rows]: any = await pool.query(
      `SELECT * FROM \`otp_verifikasi\` 
       WHERE \`email\` = ? AND \`otp_code\` = ? AND \`is_used\` = 0 
       ORDER BY \`id\` DESC LIMIT 1`,
      [normalizedEmail, trimmedCode]
    );

    if (rows && rows.length > 0) {
      const record = rows[0];
      const expiredAt = new Date(record.expired_at).getTime();

      if (Date.now() > expiredAt) {
        return { valid: false, reason: "Kode OTP telah kadaluarsa. Silakan minta kode baru." };
      }

      // Tandai OTP telah digunakan
      await pool.query("UPDATE `otp_verifikasi` SET `is_used` = 1 WHERE `id` = ?", [record.id]);
      memoryOtpStore.delete(normalizedEmail);
      return { valid: true };
    }
  } catch (err) {
    console.warn("Validasi DB gagal, mencoba verifikasi dari memory cache:", err);
  }

  // Fallback memory check
  const mem = memoryOtpStore.get(normalizedEmail);
  if (mem) {
    if (Date.now() > mem.expiredAt) {
      memoryOtpStore.delete(normalizedEmail);
      return { valid: false, reason: "Kode OTP telah kadaluarsa. Silakan minta kode baru." };
    }
    if (mem.code === trimmedCode) {
      memoryOtpStore.delete(normalizedEmail);
      return { valid: true };
    }
  }

  return { valid: false, reason: "Kode OTP salah atau tidak ditemukan." };
}
