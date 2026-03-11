export function getSiteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;

  // 1) env가 있으면 우선 사용(트레일링 슬래시 제거)
  if (env && env.startsWith("http")) return env.replace(/\/$/, "");

  // 2) fallback: 현재 접속 도메인
  if (typeof window !== "undefined") return window.location.origin;

  // 3) 서버 사이드(예외 상황) 안전망
  return "http://localhost:3000";
}
