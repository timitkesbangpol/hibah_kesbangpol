import { NextResponse } from "next/server";
import { createAndSaveOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mail";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Alamat email tidak valid." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    let namaPengguna = "";
    let isRegistered = false;

    // 1. Cek apakah email terdaftar di database MySQL tabel `pengguna`
    try {
      const [users]: any = await pool.query(
        "SELECT nama_pengguna, status, peran FROM `pengguna` WHERE LOWER(email) = ? LIMIT 1",
        [cleanEmail]
      );

      if (users && users.length > 0) {
        const user = users[0];
        // Cek status keaktifan akun
        if (user.status && user.status.toLowerCase() !== "aktif") {
          return NextResponse.json(
            {
              success: false,
              error: "Akun Anda berstatus non-aktif. Silakan hubungi Administrator untuk mengaktifkan kembali akun.",
            },
            { status: 403 }
          );
        }
        namaPengguna = user.nama_pengguna || "Pengguna";
        isRegistered = true;
      }
    } catch (dbErr) {
      console.warn("DB check error (menggunakan fallback daftar akun resmi):", dbErr);
    }

    // 2. Fallback daftar akun resmi jika database offline
    if (!isRegistered) {
      const registeredEmails: Record<string, string> = {
        "kesbangplsekre@gmail.com": "Sekre Kesbangpol",
        "kesbangpolkepalabadan@gmail.com": "Kepala Badan",
        "kesbangpolbidang01@gmail.com": "Bidang 1",
        "kesbangpolbidang02@gmail.com": "Bidang 2",
        "kesbangpolbidang03@gmail.com": "Bidang 3",
        "kesbangpolbidang04@gmail.com": "Bidang 4",
        "admin@kesbangpol.go.id": "Administrator",
      };

      if (registeredEmails[cleanEmail]) {
        isRegistered = true;
        namaPengguna = registeredEmails[cleanEmail];
      }
    }

    // Jika TIDAK TERDAFTAR, TOLAK! Jangan kirim kode OTP!
    if (!isRegistered) {
      return NextResponse.json(
        {
          success: false,
          error: "Alamat email tidak terdaftar dalam sistem. Hanya akun dinas resmi Bakesbangpol yang dapat masuk.",
        },
        { status: 403 }
      );
    }

    // 1. Generate & simpan OTP ke database/cache
    const otpCode = await createAndSaveOtp(cleanEmail, 5); // 5 menit

    // 2. Kirim via Gmail SMTP
    const mailResult = await sendOtpEmail({
      toEmail: cleanEmail,
      otpCode,
      namaPengguna,
    });

    if (!mailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Gagal mengirim email: ${mailResult.error || "Kesalahan server email"}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: mailResult.simulated
        ? "Kode OTP dicatat di server (Mode simulasi: masukkan kredensial Gmail di .env.local untuk kirim email nyata)."
        : `Kode OTP 6 digit berhasil dikirim ke ${cleanEmail}.`,
      simulated: mailResult.simulated,
    });
  } catch (err: any) {
    console.error("Error pada /api/auth/send-otp:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
