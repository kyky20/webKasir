import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface LandingNavbarProps {
  storeName: string;
  storeLogo?: string | null;
  user: { name: string; role: string } | null;
  theme: string;
  toggleTheme: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  storeName,
  storeLogo,
  user,
  theme,
  toggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');
  const navContainerRef = useRef<HTMLDivElement>(null);
  const isManualScroll = useRef(false);
  const manualScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const navLinks = [
    { name: 'Beranda', id: 'beranda' },
    { name: 'Tentang', id: 'tentang' },
    { name: 'Fitur', id: 'fitur' },
    { name: 'Keunggulan', id: 'keunggulan' },
    { name: 'Kontak', id: 'kontak' },
  ];

  // Scroll Spy for Active Section
  useEffect(() => {
    const handleScroll = () => {
      if (isManualScroll.current) return;

      if (window.scrollY < 80) {
        setActiveSection('beranda');
        return;
      }

      const isBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 80;
      if (isBottom) {
        setActiveSection('kontak');
        return;
      }

      const navOffset = 140;
      for (let i = navLinks.length - 1; i >= 0; i--) {
        const el = document.getElementById(navLinks[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= navOffset) {
            setActiveSection(navLinks[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (manualScrollTimer.current) clearTimeout(manualScrollTimer.current);
    };
  }, []);

  // Handle outside click & Escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileMenuOpen &&
        navContainerRef.current &&
        !navContainerRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Smooth scroll handler
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setActiveSection(id);
    isManualScroll.current = true;

    if (manualScrollTimer.current) {
      clearTimeout(manualScrollTimer.current);
    }

    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    manualScrollTimer.current = setTimeout(() => {
      isManualScroll.current = false;
    }, 750);
  };

  return (
    <div ref={navContainerRef} className="sticky top-0 z-50 w-full transition-colors">
      {/* 1. TOP ANNOUNCEMENT BAR (Mercury Style) */}
      <a
        href="#fitur"
        onClick={(e) => scrollToSection(e, 'fitur')}
        className="w-full bg-[#18181B] text-white text-[11px] sm:text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-white/10 hover:bg-stone-900 transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="truncate">Sistem Kasir &amp; Pembukuan Ritel Terpadu — Solusi operasional toko modern</span>
        <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
      </a>

      {/* 2. MAIN NAVBAR (Mercury Style) */}
      <header className="w-full bg-[var(--color-surface)]/90 dark:bg-[#121214]/90 backdrop-blur-xl border-b border-[var(--color-border)]/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
          {/* Left: Logo & Brand Name */}
          <a
            href="#beranda"
            onClick={(e) => scrollToSection(e, 'beranda')}
            className="flex items-center gap-3 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-lg py-1 px-1"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-xs overflow-hidden transition-transform group-hover:scale-105 duration-200">
              {storeLogo ? (
                <img src={storeLogo} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm sm:text-base tracking-widest text-[var(--color-text-primary)] uppercase leading-none">
                Kasirku POS
              </span>
              <span className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] font-medium tracking-wide">
                POS &amp; PEMBUKUAN
              </span>
            </div>
          </a>

          {/* Center: Clean Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => scrollToSection(e, link.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-150 ${isActive
                      ? 'text-[var(--color-text-primary)] font-bold bg-[var(--color-border-muted)]/70 dark:bg-white/5'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)]/40 dark:hover:bg-white/5'
                    }`}
                >
                  {link.name}
                </a>
              );
            })}
          </nav>

          {/* Right: Theme Toggle, Log In & Open Account Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] dark:hover:bg-white/10 transition-colors border border-[var(--color-border)]/60 dark:border-white/10 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Log In Link */}
            <Link
              to={user ? (user.role === 'owner' ? '/dashboard' : '/pos') : '/login'}
              className="hidden sm:inline-flex px-3 py-2 text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              {user ? 'Akun Saya' : 'Log In'}
            </Link>

            {/* Open Account / Mulai CTA Button */}
            <Link
              to={user ? (user.role === 'owner' ? '/dashboard' : '/pos') : '/login'}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs hover:shadow-md transition-all duration-200"
            >
              <span>{user ? (user.role === 'owner' ? 'Dashboard' : 'Buka Kasir') : 'Mulai Sekarang'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)] transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-[var(--color-border)] px-4 py-4 space-y-2 bg-[var(--color-surface)] dark:bg-[#121214]"
            >
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const isActive = activeSection === link.id;
                  return (
                    <a
                      key={link.id}
                      href={`#${link.id}`}
                      onClick={(e) => scrollToSection(e, link.id)}
                      className={`block px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                          ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] dark:bg-[var(--color-primary)]/15 font-semibold'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-muted)]/50'
                        }`}
                    >
                      {link.name}
                    </a>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[var(--color-border-muted)] space-y-2">
                <Link
                  to={user ? (user.role === 'owner' ? '/dashboard' : '/pos') : '/login'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{user ? (user.role === 'owner' ? 'Buka Dashboard' : 'Buka Kasir') : 'Mulai Sekarang'}</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
};
