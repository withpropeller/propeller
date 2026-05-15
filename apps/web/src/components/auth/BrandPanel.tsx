'use client'

const propellerPattern = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='210' viewBox='0 0 175 204' opacity='0.06'><path d='M99.2457 120.49L52.4157 202.17C52.0757 202.76 51.4457 203.13 50.7557 203.13H1.91572C0.445717 203.13 -0.474318 201.54 0.255682 200.27L59.1557 97.5199C59.6757 96.5999 60.8457 96.2899 61.7657 96.8099L98.5357 117.89C99.4557 118.41 99.7657 119.58 99.2457 120.5V120.49Z' fill='%23ffffff'/><path d='M173.866 82.52L141.346 139.94C140.826 140.86 139.656 141.18 138.746 140.66L101.866 119.77C100.946 119.25 100.626 118.08 101.146 117.17L139.456 49.54C139.796 48.94 139.786 48.21 139.436 47.62L139.096 47.05C138.746 46.47 138.126 46.12 137.456 46.12L31.0258 46.16C29.9658 46.16 29.1157 45.3 29.1157 44.25V1.91C29.1157 0.85 29.9758 0 31.0258 0H124.646C125.316 0 125.946 0.35 126.286 0.93L153.296 46.16L173.856 80.6C174.206 81.19 174.216 81.92 173.876 82.52H173.866Z' fill='%23ffffff'/></svg>")`

export function BrandPanel() {
  return (
    <div className="hidden lg:flex relative overflow-hidden flex-col h-full bg-propeller-navy text-white px-[56px] pt-[56px] pb-12">
      {/* Diagonal propeller pattern */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: propellerPattern,
          backgroundSize: '240px auto',
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
      <a href="/" className="relative flex items-center gap-3 text-white no-underline">
        <img src="/propeller-icon.svg" alt="" aria-hidden className="size-[26px]" />
        <span className="font-semibold text-[22px] tracking-[-0.02em]">Propeller</span>
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
