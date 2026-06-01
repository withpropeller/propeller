'use client'

const hyphenPattern = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120' opacity='0.06'><rect x='20' y='56' width='80' height='8' fill='%23ffffff'/></svg>")`

export function BrandPanel() {
  return (
    <div className="hidden lg:flex relative overflow-hidden flex-col h-full bg-propeller-navy text-white px-[56px] pt-[56px] pb-12">
      {/* Diagonal hyphen pattern */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: hyphenPattern,
          backgroundSize: '180px 180px',
          transform: 'rotate(-12deg) scale(1.4)',
          transformOrigin: 'center',
        }}
      />
      {/* Top-left radial scrim */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 100% at 0% 0%, rgba(62,89,243,0.18), transparent 60%)',
        }}
      />

      {/* Wordmark */}
      <a href="/" className="relative flex items-center text-white no-underline">
        <img src="/hyphen-logo-white.svg" alt="Hyphen" className="h-[26px] w-auto" />
      </a>

      {/* Body — anchored to bottom */}
      <div className="relative mt-auto pt-10 max-w-[460px]">
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/60">
          Merchant of record · 14 currencies
        </span>
        <h2 className="mt-3 mb-4 text-[36px] leading-[1.1] font-semibold tracking-[-0.02em]">
          Sell to Africa.
          <br />
          Get paid <span className="text-propeller-blue">without the headache.</span>
        </h2>
        <p className="text-[15px] leading-[1.55] text-white/70 mb-8 max-w-[420px]">
          One integration. Local rails across the continent. Compliance handled, settled in the
          currency you choose.
        </p>

        {/* Trust quote */}
        <div className="rounded-[16px] px-5 py-[18px] bg-white/[0.06] border border-white/10 backdrop-blur-md">
          <p className="text-[15px] leading-[1.5] text-white mb-3">
            &ldquo;We added Nigeria, Kenya, and Ghana in a week — without rebuilding our
            reconciliation.&rdquo;
          </p>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-propeller-blue text-white flex items-center justify-center font-semibold text-[13px]">
              AO
            </div>
            <div className="text-[12px] text-white/70 leading-[1.4]">
              <div className="text-white font-medium">Amara Obi</div>
              VP Finance, Lumen
            </div>
          </div>
        </div>

        {/* Compliance badges */}
        <div className="mt-8 flex flex-wrap gap-3.5 items-center">
          {['SOC 2', 'PCI DSS L1', 'ISO 27001'].map((b) => (
            <span
              key={b}
              className="text-[11px] px-2.5 py-[5px] rounded-full border border-white/[0.18] text-white/75 font-mono whitespace-nowrap"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
