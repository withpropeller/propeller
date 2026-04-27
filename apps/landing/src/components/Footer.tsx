export default function Footer() {
  return (
    <footer id="footer" className="bg-cream-100 border-t border-warm-border">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20 py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          {/* Logo & tagline */}
          <div className="max-w-xs">
            <a href="#" className="flex items-center mb-4">
              <img
                src="./propeller-wordmark-dark.svg"
                alt="Propeller"
                className="h-5 w-auto"
              />
            </a>
            <p className="text-sm text-warm-muted leading-body">
              The regulated payment layer for China–Africa trade. Settle NGN.
              Receive USDC.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-16">
            <div>
              <p className="text-xs font-medium uppercase tracking-label text-warm-light mb-4">
                Product
              </p>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <a
                    href="#features"
                    className="text-sm text-warm-muted hover:text-warm-text transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="text-sm text-warm-muted hover:text-warm-text transition-colors"
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-warm-muted hover:text-warm-text transition-colors"
                  >
                    API Reference
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-label text-warm-light mb-4">
                Company
              </p>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <a
                    href="#mission"
                    className="text-sm text-warm-muted hover:text-warm-text transition-colors"
                  >
                    Mission
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-warm-muted hover:text-warm-text transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-warm-muted hover:text-warm-text transition-colors"
                  >
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-label text-warm-light mb-4">
                Legal
              </p>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <a
                    href="#"
                    className="text-sm text-warm-muted hover:text-warm-text transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-warm-muted hover:text-warm-text transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-warm-muted hover:text-warm-text transition-colors"
                  >
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 md:mt-16 pt-8 border-t border-warm-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-warm-light">
            &copy; {new Date().getFullYear()} Propeller. All rights reserved.
          </p>
          <p className="text-xs text-warm-light">
            A Reef product. Regulated payment services.
          </p>
        </div>
      </div>
    </footer>
  )
}
