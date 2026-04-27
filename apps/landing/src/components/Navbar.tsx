import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Mission', href: '#mission' },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-runway-black/90 backdrop-blur-md border-b border-runway-borderDark'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center">
            <img
              src="/propeller-logo-white.svg"
              alt="Propeller"
              className="h-6 sm:h-5 w-auto"
            />
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-runway-coolSlate hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="hidden md:inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-runway-propellerBlue hover:bg-runway-propellerBlue/90 rounded-sharp transition-colors"
            >
              Get Started
            </a>
            <button
              className="md:hidden text-white"
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
        <div className="md:hidden bg-runway-black/95 backdrop-blur-md border-t border-runway-borderDark">
          <div className="px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-base font-medium text-runway-coolSlate hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#"
              className="mt-2 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-runway-propellerBlue rounded-sharp"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
