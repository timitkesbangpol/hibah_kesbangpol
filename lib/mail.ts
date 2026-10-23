import nodemailer from "nodemailer";

export interface SendOtpOptions {
  toEmail: string;
  otpCode: string;
  namaPengguna?: string;
}

export interface SendOtpResult {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Mengirimkan kode OTP ke alamat Gmail penerima.
 * Jika kredensial GMAIL_USER / GMAIL_APP_PASSWORD belum diatur di .env.local,
 * fungsi ini akan mencetak kode OTP di console (mode simulasi) agar pengujian tetap berjalan.
 */
export async function sendOtpEmail({
  toEmail,
  otpCode,
  namaPengguna = "Pengguna",
}: SendOtpOptions): Promise<SendOtpResult> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const rawPass = process.env.GMAIL_APP_PASSWORD?.trim() || "";
  // Google App Password biasanya diberikan dalam kelompok 4 huruf dengan spasi (misal: 'abcd efgh ijkl mnop')
  const gmailAppPass = rawPass.replace(/\s+/g, "");
  const fromName = process.env.EMAIL_FROM_NAME || "Bakesbangpol Kota Bandung";

  // Mode Fallback/Simulasi jika kredensial belum diisi
  if (!gmailUser || !gmailAppPass) {
    console.log("\n=======================================================");
    console.log("🔔 [SIMULASI OTP EMAIL - BELUM ADA KREDENSIAL GMAIL]");
    console.log(`Tujuan Email : ${toEmail}`);
    console.log(`Penerima     : ${namaPengguna}`);
    console.log(`KODE OTP     : >>> ${otpCode} <<<`);
    console.log("Catatan      : Masukkan GMAIL_USER dan GMAIL_APP_PASSWORD di .env.local untuk kirim email nyata.");
    console.log("=======================================================\n");

    return {
      success: true,
      simulated: true,
    };
  }

  // Buat transporter Nodemailer khusus Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Port 465 SSL
    auth: {
      user: gmailUser,
      pass: gmailAppPass,
    },
  });

  const emailHtml = `
  <!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode Verifikasi Masuk</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
            
            <!-- Header Bar Merah Marun Kesbangpol -->
            <tr>
              <td style="background: linear-gradient(135deg, #7B0B14 0%, #94111C 50%, #141B4D 100%); padding: 36px 30px; text-align: center;">
                <div style="display: inline-block; padding: 6px 14px; background-color: rgba(255, 255, 255, 0.15); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #fecdd3; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px;">
                  Bakesbangpol Kota Bandung
                </div>
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">
                  Sistem Pengarsipan Hibah
                </h1>
                <p style="margin: 6px 0 0 0; color: #fbcfe8; font-size: 13px; opacity: 0.9;">
                  Verifikasi Keamanan Akses Portal
                </p>
              </td>
            </tr>

            <!-- Konten Utama -->
            <tr>
              <td style="padding: 32px 30px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.6;">
                  Halo <strong>${namaPengguna}</strong>,
                </p>
                <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                  Kami mendeteksi permintaan masuk ke akun Anda. Gunakan kode verifikasi (OTP) sekali pakai berikut untuk melanjutkan:
                </p>

                <!-- Box Kode OTP -->
                <div style="background: #fff1f2; border: 2px dashed #fda4af; border-radius: 16px; padding: 22px; text-align: center; margin: 24px 0;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #9f1239; margin-bottom: 8px;">
                    Kode OTP Verifikasi Anda
                  </div>
                  <div style="font-size: 38px; font-weight: 900; letter-spacing: 0.35em; color: #94111C; font-family: 'Courier New', Courier, monospace; padding-left: 0.35em;">
                    ${otpCode}
                  </div>
                  <div style="margin-top: 10px; font-size: 12px; color: #881337;">
                    ⏱ Berlaku selama <strong>5 menit</strong>
                  </div>
                </div>

                <!-- Peringatan Keamanan -->
                <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; border-radius: 6px; padding: 12px 16px; margin: 24px 0;">
                  <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
                    <strong style="color: #b91c1c;">Penting:</strong> Jangan pernah memberikan kode ini kepada siapa pun, termasuk pihak yang mengatasnamakan Bakesbangpol Kota Bandung.
                  </p>
                </div>

                <!-- Tips Folder Spam / Kontak -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; margin: 18px 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                  💡 <strong>Tips:</strong> Jika email ini masuk ke folder Spam, silakan klik tombol <em>"Laporkan Bukan Spam" (Report Not Spam)</em> agar pengiriman kode berikutnya selalu langsung masuk ke Kotak Masuk Utama Anda.
                </div>

                <p style="margin: 20px 0 0 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                  Jika Anda tidak melakukan upaya masuk ini, silakan abaikan email ini atau segera laporkan ke tim Administrator Sistem.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                  Email otomatis dari <strong>Sistem Pengarsipan NPHD Hibah</strong><br>
                  Badan Kesatuan Bangsa dan Politik Kota Bandung
                </p>
                <p style="margin: 6px 0 0 0; font-size: 10px; color: #94a3b8;">
                  © 2026 Pemerintah Kota Bandung. Hak Cipta Dilindungi.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${gmailUser}>`,
      to: toEmail,
      subject: `[OTP] Kode Verifikasi Masuk: ${otpCode} - Bakesbangpol`,
      text: `Kode verifikasi (OTP) Anda adalah: ${otpCode}. Kode ini berlaku selama 5 menit. Jangan bagikan kepada siapa pun.`,
      html: emailHtml,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("Gagal mengirim email OTP via Gmail:", error);
    return {
      success: false,
      error: error?.message || "Gagal mengirim email OTP",
    };
  }
}
