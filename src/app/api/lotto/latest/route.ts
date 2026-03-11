import { NextResponse } from "next/server";
import { getLatestLottoDraw } from "@/lib/lottoApi";

export async function GET() {
  try {
    const latest = await getLatestLottoDraw();

    if (!latest) {
      return NextResponse.json(
        { message: "최신 회차를 가져오지 못했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(latest);
  } catch {
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}