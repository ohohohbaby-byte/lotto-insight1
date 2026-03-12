import { NextResponse } from "next/server";
import { getNaverAuthUrl } from "@/lib/naverAuth";

export const runtime = "nodejs";

export async function GET() {
  const state = Math.random().toString(36).substring(2, 15);

  const response = NextResponse.redirect(getNaverAuthUrl(state));

  // state를 쿠키에 저장 (CSRF 방지)
  response.cookies.set("naver_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10분
    path: "/",
    sameSite: "lax",
  });

  return response;
}
