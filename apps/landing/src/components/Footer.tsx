export default function Footer() {
  return (
    <footer id="footer" className="bg-cream-100 border-t border-warm-border">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-6">
          {/* Logo & social */}
          <div className="col-span-2">
            <a href="#" className="flex items-center mb-6">
              <img
                src="./propeller-logo-dark.svg"
                alt="Propeller"
                className="h-5 w-auto"
              />
            </a>
            <div className="flex items-center gap-3 mb-6">
              <a href="#" className="text-warm-light hover:text-warm-text transition-colors text-sm">
                in
              </a>
              <a href="#" className="text-warm-light hover:text-warm-text transition-colors text-sm">
                X
              </a>
              <a href="#" className="text-warm-light hover:text-warm-text transition-colors text-sm">
                YT
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-blue-700 rounded-sm flex items-center justify-center">
                <span className="text-white text-[6px] font-bold">NG</span>
              </div>
              <p className="text-[10px] text-warm-light leading-tight">
                Licensed & Regulated
                <br />
                Payment Service Provider
              </p>
            </div>
          </div>

          {/* Products */}
          <div>
            <p className="text-xs font-medium text-warm-text mb-4">Products</p>
            <ul className="flex flex-col gap-2.5">
              {['Virtual Accounts', 'Payments', 'Fraud', 'User Verification', 'FX', 'Onboarding', 'Dashboard', 'Integration'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs text-warm-muted hover:text-warm-text transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <p className="text-xs font-medium text-warm-text mb-4">Solutions</p>
            <ul className="flex flex-col gap-2.5">
              {['B2C Marketplaces', 'B2B Platforms', 'Rental Marketplaces', 'Retail Marketplaces', 'Crowdfunding'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs text-warm-muted hover:text-warm-text transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div>
            <p className="text-xs font-medium text-warm-text mb-4">Developers</p>
            <ul className="flex flex-col gap-2.5">
              {['Documentation', 'API Reference', 'API Demonstration'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs text-warm-muted hover:text-warm-text transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs font-medium text-warm-text mt-6 mb-4">Resources</p>
            <ul className="flex flex-col gap-2.5">
              {['FAQ', 'Blog'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs text-warm-muted hover:text-warm-text transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-medium text-warm-text mb-4">Company</p>
            <ul className="flex flex-col gap-2.5">
              {['About us', 'Working @Propeller', 'Newsroom'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs text-warm-muted hover:text-warm-text transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs font-medium text-warm-text mt-6 mb-4">Contact</p>
            <ul className="flex flex-col gap-2.5">
              {['Contact us', 'Contact sales'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs text-warm-muted hover:text-warm-text transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 md:mt-16 pt-8 border-t border-warm-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-warm-light">
            &copy; {new Date().getFullYear()} Propeller. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {['Legal Notice', 'Privacy', 'Terms & Conditions', 'Cookies', 'Compliance'].map((item) => (
              <a key={item} href="#" className="text-[10px] text-warm-light hover:text-warm-text transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 pt-6 border-t border-warm-border">
          <p className="text-[10px] text-warm-light leading-relaxed max-w-4xl">
            Propeller is a software platform, not a financial institution. All
            payments, settlement, and financial services connected through our
            API are facilitated by regulated third-party partners who hold the
            required licenses and authorizations in their respective
            jurisdictions. Propeller does not hold funds or provide regulated
            financial services directly.
          </p>
          <p className="text-[10px] text-warm-light mt-2">
            Propeller is a trademark of Digital Credit Ltd.
          </p>
        </div>
      </div>
    </footer>
  )
}
