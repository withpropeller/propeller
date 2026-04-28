import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Solutions', href: '#solutions' },
  { label: 'Developers', href: '#developers' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Docs', href: '#footer' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'top-0 bg-cream-50/95 backdrop-blur-md border-b border-warm-border shadow-sm'
          : 'top-0 bg-transparent'
      }`}
    >
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center">
            <img
              src="./propeller-logo-dark.svg"
              alt="Propeller"
              className="h-6 w-auto"
            />
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-warm-muted hover:text-warm-text transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="hidden md:inline-flex items-center px-5 py-2 text-sm font-semibold text-runway-propellerBlue border border-runway-propellerBlue/30 hover:bg-runway-propellerBlue/5 rounded-sharp transition-colors"
            >
              Get Started
            </a>
            <button
              className="md:hidden text-warm-text"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-cream-50/95 backdrop-blur-md border-t border-warm-border">
          <div className="px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-base font-medium text-warm-muted hover:text-warm-text transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#"
              className="mt-2 inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-runway-propellerBlue border border-runway-propellerBlue/30 rounded-sharp"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
