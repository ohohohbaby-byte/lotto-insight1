import { NextRequest, NextResponse } from "next/server";
import { getLottoByRound } from "@/lib/lottoApi";

type RouteContext = {
  params: Promise<{
    round: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { round } = await context.params;
    const parsedRound = Number(round);

    if (!Number.isInteger(parsedRound) || parsedRound < 1) {
      return NextResponse.json(
        { message: "유효한 회차 번호가 아닙니다." },
        { status: 400 }
      );
    }

    const draw = await getLottoByRound(parsedRound);

    if (!draw) {
      return NextResponse.json(
        { message: "해당 회차 데이터를 찾지 못했습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(draw);
  } catch {
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}