import { NextResponse } from "next/server";
import { verifyOtpCode } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email dan kode OTP wajib diisi." },
        { status: 400 }
      );
    }

    const verification = await verifyOtpCode(email, otp);

    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.reason || "Kode OTP tidak valid." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verifikasi OTP berhasil.",
    });
  } catch (err: any) {
    console.error("Error pada /api/auth/verify-otp:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
