import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { navLinks } from '../content/siteContent'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Pages with a dark hero where white hamburger lines are fine
  const isHomePage = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    // Check immediately on mount and on route change
    setIsScrolled(window.scrollY > 24)
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const closeMenu = () => {
    if (!isOpen) return
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 250)
  }

  const handleNavigate = (link) => {
    if (link.type === 'route' && link.href) {
      if (link.href === '/' && location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        navigate(link.href)
        // Scroll to top when navigating to a new page (e.g. going Home from Story)
        window.scrollTo({ top: 0, behavior: 'instant' })
      }
      closeMenu()
      return
    }

    if (link.type === 'scroll' && link.target) {
      if (location.pathname === '/') {
        // Already on home — just scroll
        const element = document.getElementById(link.target)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      } else {
        // Navigate to home with hash — Home's useScrollToHash will handle scrolling
        navigate(`/#${link.target}`)
      }
      closeMenu()
    }
  }

  // Determine hamburger line color based on page and scroll state
  const getHamburgerColor = () => {
    if (isOpen) return 'text-white'
    if (isScrolled) return 'text-charcoal'
    if (isHomePage) return 'text-white'
    return 'text-orange-500'
  }
  const hamburgerColor = getHamburgerColor()

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-sm shadow-slate-200/60'
          : 'bg-transparent'
          }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          {/* Logo */}
          <Link
            to="/"
            className="font-display text-lg font-semibold tracking-tight text-orange-500 sm:text-xl"
            onClick={() => {
              closeMenu()
              window.scrollTo({ top: 0, behavior: 'instant' })
            }}
          >
            Gandham Spices
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                className="relative text-sm font-medium text-orange-500/80 transition-all duration-300 hover:text-orange-500 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-saffron after:transition-all after:duration-300 hover:after:w-full"
                onClick={() => handleNavigate(link)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <button
            type="button"
            className="hidden rounded-full bg-saffron px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-saffron/30 transition-all duration-300 hover:bg-terracotta hover:shadow-lg hover:shadow-terracotta/30 active:scale-95 lg:inline-flex"
            onClick={() => handleNavigate({ type: 'scroll', target: 'blends' })}
          >
            Explore Our Blends
          </button>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="relative z-[10000] flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-300 lg:hidden"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
            onClick={() => (isOpen ? closeMenu() : setIsOpen(true))}
          >
            <div className="flex w-5 flex-col items-end gap-[5px]">
              <span
                className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${isOpen ? 'translate-y-[7px] rotate-45 text-white' : hamburgerColor
                  }`}
              />
              <span
                className={`block h-[2px] rounded-full bg-current transition-all duration-300 ${isOpen ? 'w-0 opacity-0 text-white' : `w-3.5 ${hamburgerColor}`
                  }`}
              />
              <span
                className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${isOpen ? '-translate-y-[7px] -rotate-45 text-white' : hamburgerColor
                  }`}
              />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay — OUTSIDE <header> to avoid backdrop-filter containing block */}
      {(isOpen || isClosing) && (
        <div
          className={`fixed inset-0 z-[9999] lg:hidden ${isClosing ? 'mobile-menu-exit' : 'mobile-menu-enter'
            }`}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.97)' }}
        >
          {/* Backdrop blur layer */}
          <div className="absolute inset-0 backdrop-blur-2xl" />

          {/* Menu Content */}
          <div className="relative z-10 flex h-full flex-col overflow-y-auto px-6 pb-10 pt-24">
            {/* Nav Links */}
            <nav className="menu-link-stagger flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  className="group flex items-center gap-4 rounded-2xl px-4 py-4 text-left transition-colors duration-200 hover:bg-white/5 active:bg-white/10"
                  onClick={() => handleNavigate(link)}
                >
                  <span className="text-2xl font-semibold tracking-tight text-white transition-colors group-hover:text-saffron">
                    {link.label}
                  </span>
                </button>
              ))}
            </nav>

            {/* Visual Separator */}
            <div className="mx-4 my-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* CTA Button */}
            <div className="px-4">
              <button
                type="button"
                className="w-full rounded-full bg-gradient-to-r from-saffron to-orange-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-saffron/30 transition-all duration-300 hover:shadow-xl active:scale-[0.98]"
                onClick={() => handleNavigate({ type: 'scroll', target: 'blends' })}
              >
                Explore Our Blends
              </button>
            </div>

            {/* Bottom Info */}
            <div className="mt-auto px-4 pt-8">
              <a
                href="https://instagram.com/gandham.spices"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-slate-400 transition-colors hover:text-sand"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                <span className="tracking-wide">@gandham.spices</span>
              </a>
              <p className="mt-3 text-xs text-slate-500">
                Handcrafted with love in Brahmavar
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
