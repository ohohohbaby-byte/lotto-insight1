import { LottoDraw } from "@/types/lotto";

type Props = {
  draws: LottoDraw[];
};

function buildHeatmap(draws: LottoDraw[]) {
  const map: Record<number, number> = {};

  for (let i = 1; i <= 45; i++) {
    map[i] = 0;
  }

  for (const draw of draws) {
    for (const num of draw.numbers) {
      map[num]++;
    }
  }

  return Object.entries(map).map(([number, count]) => ({
    number: Number(number),
    count,
  }));
}

function getHeatClass(count: number, max: number) {
  const ratio = max === 0 ? 0 : count / max;

  if (ratio > 0.8) return "bg-red-500 text-white";
  if (ratio > 0.6) return "bg-orange-400 text-black";
  if (ratio > 0.4) return "bg-yellow-300 text-black";
  if (ratio > 0.2) return "bg-green-400 text-black";

  return "bg-blue-400 text-black";
}

export default function NumberHeatmap({ draws }: Props) {
  const heatmap = buildHeatmap(draws);

  const maxCount = Math.max(...heatmap.map((h) => h.count));

  return (
    <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[#d4af37]">🔥</span>
        <h3 className="text-lg font-bold text-[#f1d17a]">
          번호 히트맵 (최근 {draws.length}회)
        </h3>
      </div>

      <div className="grid grid-cols-9 gap-2">
        {heatmap.map((item) => (
          <a
            key={item.number}
            href={`/numbers/${item.number}`}
            className={`rounded-xl px-3 py-3 text-center text-sm font-semibold shadow-sm transition hover:scale-[1.05] ${getHeatClass(
              item.count,
              maxCount
            )}`}
          >
            <div>{item.number}</div>
            <div className="text-xs opacity-80">{item.count}</div>
          </a>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/70">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-red-500"></div>
          많이 출현
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-orange-400"></div>
          상위 출현
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-yellow-300"></div>
          평균
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-400"></div>
          낮은 출현
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-blue-400"></div>
          거의 없음
        </div>
      </div>
    </div>
  );
}