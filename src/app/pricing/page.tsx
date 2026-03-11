export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f1d17a]/70">
            Lotto Insight Pricing
          </p>
          <h1 className="mt-3 text-4xl font-bold text-[#f1d17a]">
            프리미엄 플랜 안내
          </h1>
          <p className="mt-4 text-sm text-white/60">
            무료 추천으로 시작하고, 데이터 기반 고급 분석이 필요할 때 프리미엄으로 업그레이드하세요.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-8 shadow-xl">
            <div className="mb-6">
              <p className="text-sm font-semibold text-white/60">FREE</p>
              <h2 className="mt-2 text-2xl font-bold text-white">무료 추천</h2>
              <p className="mt-2 text-sm text-white/50">
                기본 조건 기반 조합 생성기
              </p>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold text-white">₩0</p>
              <p className="text-sm text-white/40">항상 무료</p>
            </div>

            <div className="space-y-3 text-sm text-white/70">
              <p>• 랜덤 조합 생성</p>
              <p>• 고정수 / 제외수 설정</p>
              <p>• 홀짝 / 고저 / 합계 조건 반영</p>
              <p>• 연속 번호 포함 옵션</p>
              <p>• 추천 조합 복사 기능</p>
            </div>

            <a
              href="/signup"
              className="mt-8 block rounded-xl border border-white/10 bg-[#0f1526] px-4 py-3 text-center font-semibold text-white/80 hover:bg-white/5"
            >
              무료로 시작하기
            </a>
          </div>

          <div className="rounded-3xl border border-[#d4af37]/30 bg-[linear-gradient(135deg,rgba(212,175,55,0.14),rgba(255,255,255,0.02))] p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#f1d17a]">PREMIUM</p>
                <h2 className="mt-2 text-2xl font-bold text-[#f1d17a]">
                  데이터 기반 분석
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  상위 추천 조합과 프리미엄 분석 점수 제공
                </p>
              </div>

              <span className="rounded-full bg-[#d4af37] px-3 py-1 text-xs font-bold text-[#11182b]">
                추천
              </span>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold text-[#f1d17a]">₩9,900</p>
              <p className="text-sm text-white/40">월 구독</p>
            </div>

            <div className="space-y-3 text-sm text-white/75">
              <p>• 상위 10개 프리미엄 조합 전체 공개</p>
              <p>• 최근 회차 기반 출현 빈도 반영</p>
              <p>• 최근 미출현 번호 점수 반영</p>
              <p>• 홀짝 / 고저 / 합계 / 연속 패턴 분석</p>
              <p>• 조합별 분석 점수 제공</p>
              <p>• 추후 MY 로또 저장 기능 연동</p>
            </div>

            <a
              href="/signup"
              className="mt-8 block rounded-xl bg-[#d4af37] px-4 py-3 text-center font-bold text-[#11182b] hover:brightness-110"
            >
              프리미엄 시작하기
            </a>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
          <h3 className="text-lg font-bold text-[#f1d17a]">어떤 사용자에게 맞을까요?</h3>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#0f1526] p-4">
              <p className="font-semibold text-white">무료 추천이 맞는 경우</p>
              <p className="mt-2 text-sm text-white/60">
                가볍게 번호를 뽑아보고 싶거나, 직접 조건을 걸어서 조합을 만들어보고 싶은 사용자
              </p>
            </div>

            <div className="rounded-2xl bg-[#0f1526] p-4">
              <p className="font-semibold text-white">프리미엄이 맞는 경우</p>
              <p className="mt-2 text-sm text-white/60">
                단순 랜덤보다 데이터 기반 점수와 상위 추천 조합을 보고 싶은 사용자
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}