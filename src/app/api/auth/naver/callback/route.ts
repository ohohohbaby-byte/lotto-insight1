import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNaverToken, getNaverProfile } from "@/lib/naverAuth";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("naver_oauth_state")?.value;

  // CSRF 검증
  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${SITE_URL}/login?error=invalid_state`);
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1) 네이버 토큰 발급
    const tokenData = await getNaverToken(code, state);

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${SITE_URL}/login?error=token_failed`);
    }

    // 2) 네이버 프로필 조회
    const profileData = await getNaverProfile(tokenData.access_token);
    const naverUser = profileData.response;

    if (!naverUser?.email) {
      return NextResponse.redirect(`${SITE_URL}/login?error=no_email`);
    }

    const email = naverUser.email;
    const name = naverUser.name ?? naverUser.nickname ?? email.split("@")[0];
    const nickname = naverUser.nickname ?? name;
    const naverId = naverUser.id;

    // 3) Supabase에서 기존 유저 확인
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      // 기존 유저면 로그인
      userId = existingUser.id;
    } else {
      // 신규 유저면 생성
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { name, nickname, provider: "naver", naver_id: naverId },
        });

      if (createError || !newUser.user) {
        return NextResponse.redirect(`${SITE_URL}/login?error=create_failed`);
      }

      userId = newUser.user.id;

      // 프로필 저장
      await supabaseAdmin.from("profiles").upsert(
        {
          id: userId,
          name,
          nickname,
          provider: "naver",
          naver_id: naverId,
          is_adult: false,
          terms_required: false,
        },
        { onConflict: "id" }
      );
    }

    // 4) 로그인 링크 생성 (매직 링크 방식)
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: SITE_URL },
      });

    if (linkError || !linkData.properties?.hashed_token) {
      return NextResponse.redirect(`${SITE_URL}/login?error=link_failed`);
    }

    // 5) 쿠키 정리 후 리디렉션
    const response = NextResponse.redirect(
      `${SITE_URL}/api/auth/naver/session?token=${linkData.properties.hashed_token}&email=${encodeURIComponent(email)}`
    );

    response.cookies.delete("naver_oauth_state");
    return response;

  } catch (error) {
    console.error("naver callback error:", error);
    return NextResponse.redirect(`${SITE_URL}/login?error=unknown`);
  }
}
