import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { KaizenLogo } from '@/components/KaizenLogo';
import { Menu, X, Search } from 'lucide-react';

interface NavbarProps {
  onRegisterClick?: () => void;
  onCheckStatusClick?: () => void;
}

interface MenuItem {
  label: string;
  href: string;
  isRoute?: boolean;
}

export const Navbar = memo(function Navbar({ onRegisterClick, onCheckStatusClick }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchOffset, setTouchOffset] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { label: 'Home', href: '#home' },
    { label: 'Events', href: '#events' },
    { label: 'Schedule', href: '/schedule', isRoute: true },
    { label: 'Horror Dramatics', href: '/horror-dramatics', isRoute: true },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    setTouchOffset({ x: 0, y: 0 });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // Only allow swipe right or swipe down
    if (deltaX > 0 || deltaY > 0) {
      setTouchOffset({ x: Math.max(0, deltaX), y: Math.max(0, deltaY) });
    }
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => {
    const threshold = 100;

    // Close menu if swiped right more than threshold or down more than threshold
    if (touchOffset.x > threshold || touchOffset.y > threshold) {
      closeMenu();
    } else {
      setTouchOffset({ x: 0, y: 0 });
    }

    setTouchStart(null);
  }, [touchOffset, closeMenu]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm w-full max-w-full overflow-x-hidden" style={{ contain: 'layout style' }}>
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-2.5 lg:py-3 overflow-x-hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-shrink-0 z-50 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] xl:w-[220px]">
              <KaizenLogo className="w-full h-auto" />
            </div>

            <div className="hidden lg:flex items-center gap-6 xl:gap-8">
              {menuItems.map((item) => (
                item.isRoute ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="text-white/90 hover:text-red-500 transition-colors text-[15px]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={location.pathname === '/' ? item.href : `/${item.href}`}
                    onClick={(e) => {
                      if (location.pathname !== '/') {
                        e.preventDefault();
                        navigate('/' + item.href);
                      }
                    }}
                    className="text-white/90 hover:text-red-500 transition-colors text-[15px]"
                  >
                    {item.label}
                  </a>
                )
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={onCheckStatusClick}
                className="flex items-center gap-2 px-5 py-2.5 text-white/90 hover:text-red-500 transition-colors text-[14px] border border-white/20 hover:border-red-500/50"
              >
                <Search className="w-4 h-4" />
                Check Status
              </button>
              <button
                onClick={onRegisterClick}
                className="px-8 py-2.5 border border-red-600 text-white hover:bg-red-600/10 transition-colors text-[14px]"
              >
                Register Now
              </button>
            </div>

            <button
              onClick={toggleMenu}
              className="lg:hidden z-50 p-2 text-white hover:text-red-500 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6 sm:w-7 sm:h-7" /> : <Menu className="w-6 h-6 sm:w-7 sm:h-7" />}
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/95 backdrop-blur-lg animate-fade-in"
          style={{
            opacity: Math.max(0, 1 - (touchOffset.x / 300) - (touchOffset.y / 300)),
            transition: touchStart ? 'none' : 'opacity 0.3s ease-out'
          }}
          onClick={closeMenu}
        >
          <div
            ref={menuRef}
            className="flex flex-col items-center justify-center min-h-screen px-6 py-20"
            style={{
              transform: `translate(${touchOffset.x}px, ${touchOffset.y}px)`,
              transition: touchStart ? 'none' : 'transform 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex flex-col items-center gap-6 sm:gap-8 w-full max-w-md">
              {menuItems.map((item, index) => (
                item.isRoute ? (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={closeMenu}
                    className="text-white/90 hover:text-red-500 transition-all duration-300 text-2xl sm:text-3xl md:text-4xl hover:scale-110 w-full text-center animate-fade-in"
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      animationFillMode: 'both'
                    }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={location.pathname === '/' ? item.href : `/${item.href}`}
                    onClick={(e) => {
                      closeMenu();
                      if (location.pathname !== '/') {
                        e.preventDefault();
                        navigate('/' + item.href);
                      }
                    }}
                    className="text-white/90 hover:text-red-500 transition-all duration-300 text-2xl sm:text-3xl md:text-4xl hover:scale-110 w-full text-center animate-fade-in"
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      animationFillMode: 'both'
                    }}
                  >
                    {item.label}
                  </a>
                )
              ))}
              <button
                onClick={() => { closeMenu(); if (onCheckStatusClick) onCheckStatusClick(); }}
                className="mt-4 flex items-center justify-center gap-2 px-8 py-3 border border-white/30 text-white hover:text-red-500 hover:border-red-500/50 transition-all duration-300 text-lg sm:text-xl hover:scale-105 animate-fade-in"
                style={{
                  animationDelay: '0.2s',
                  animationFillMode: 'both'
                }}
              >
                <Search className="w-5 h-5" />
                Check Status
              </button>
              <button
                onClick={() => { closeMenu(); if (onRegisterClick) onRegisterClick(); }}
                className="mt-2 px-10 py-3 border-2 border-red-600 text-white hover:bg-red-600/20 transition-all duration-300 text-lg sm:text-xl hover:scale-105 animate-fade-in"
                style={{
                  animationDelay: '0.25s',
                  animationFillMode: 'both'
                }}
              >
                Register Now
              </button>
            </div>
            <p className="absolute bottom-8 text-white/30 text-sm animate-pulse">
              Swipe down or tap anywhere to close
            </p>
          </div>
        </div>
      )}

    </>
  );
});
