'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';

// Logo component
const Logo = () => (
  <Link href="/" className="flex items-center gap-2.5">
    <div className="w-6 h-6">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M16 2L28.66 9.5V24.5L16 32L3.34 24.5V9.5L16 2Z" stroke="#F2EDE5" strokeWidth="1.5" fill="none" opacity="0.7"/>
        <path d="M16 7L24.66 12V22L16 27L7.34 22V12L16 7Z" stroke="#F2EDE5" strokeWidth="1" fill="none" opacity="0.3"/>
      </svg>
    </div>
    <span className="font-mono text-[15px] font-bold tracking-tight text-cream">
      human.farm
    </span>
  </Link>
);

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('human-farm-user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('human-farm-user');
    localStorage.removeItem('human-farm-token');
    setUser(null);
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/browse', label: 'Operators' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/mcp', label: 'For Agents' },
  ];

  return (
    <nav className="border-b border-cream/10 bg-dark/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-[1140px] mx-auto px-5 sm:px-10">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-terra'
                    : 'text-cream/60 hover:text-cream'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm text-cream/60 hover:text-cream"
                >
                  <User size={18} />
                  <span>{user.profile?.display_name || user.profile?.name || user.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-cream/60 hover:text-cream"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-cream/60 hover:text-cream"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-1.5 bg-terra text-cream text-sm font-semibold rounded-full hover:bg-terra-deep transition-all hover:-translate-y-0.5"
                >
                  Apply Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-cream"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-cream/10 bg-dark">
          <div className="px-5 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-cream/60 hover:text-cream"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-cream/10">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-sm text-cream/60 hover:text-cream"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block text-sm text-cream/60 hover:text-cream mb-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block w-full text-center px-4 py-2 bg-terra text-cream text-sm font-semibold rounded-full hover:bg-terra-deep"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Apply Now
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
