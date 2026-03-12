export function getNaverAuthUrl(state: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.NAVER_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/naver/callback`,
    state,
  });

  return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
}

export async function getNaverToken(code: string, state: string) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.NAVER_CLIENT_ID!,
    client_secret: process.env.NAVER_CLIENT_SECRET!,
    code,
    state,
  });

  const res = await fetch(
    `https://nid.naver.com/oauth2.0/token?${params.toString()}`,
    { method: "GET", headers: { "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID!, "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET! } }
  );

  return res.json();
}

export async function getNaverProfile(accessToken: string) {
  const res = await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return res.json();
}
