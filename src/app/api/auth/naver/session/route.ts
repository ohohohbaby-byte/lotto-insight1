import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(`${SITE_URL}/login?error=missing_params`);
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: "magiclink",
    });

    if (error || !data.session) {
      return NextResponse.redirect(`${SITE_URL}/login?error=session_failed`);
    }

    const response = NextResponse.redirect(SITE_URL);

    // Supabase 세션 쿠키 설정
    response.cookies.set(
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL!.split("//")[1].split(".")[0]}-auth-token`,
      JSON.stringify(data.session),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
      }
    );

    return response;
  } catch (error) {
    console.error("session error:", error);
    return NextResponse.redirect(`${SITE_URL}/login?error=unknown`);
  }
}
