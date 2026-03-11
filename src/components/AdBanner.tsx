type Props = {
  height?: number;
};

export default function AdBanner({ height = 120 }: Props) {
  return (
    <div
      className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-[#0f1526] text-white/50"
      style={{ height }}
    >
      광고 영역
    </div>
  );
}