import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Phone,
  BookOpen,
  Award,
  Info,
  Home,
  LogOut,
  User as UserIcon,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, InstituteBranding } from '../types';
import { fsSubscribeBrandingSettings, DEFAULT_BRANDING } from '../lib/firestoreService';

interface NavbarProps {
  currentPath: string;
  user: User | null;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onOpenEnroll: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  user,
  onNavigate,
  onLogout,
  onOpenEnroll,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branding, setBranding] = useState<InstituteBranding>(DEFAULT_BRANDING);
  const [logoLoadError, setLogoLoadError] = useState(false);

  useEffect(() => {
    const unsub = fsSubscribeBrandingSettings((liveBranding) => {
      setBranding(liveBranding || DEFAULT_BRANDING);
      setLogoLoadError(false);
    });
    return () => unsub();
  }, []);

  const navLinks = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'About Us', path: '/about', icon: Info },
    { label: 'Courses', path: '/courses', icon: BookOpen },
    { label: 'Certificate Verify', path: '/results', icon: Award },
    { label: 'Contact Us', path: '/contact', icon: MessageSquare },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileOpen(false);
  };

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMobileOpen(false);
    onLogout();
  };

  const hasCustomLogo = Boolean(branding.logoUrl && branding.logoUrl.trim().length > 0 && !logoLoadError);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 text-stone-800 shadow-xs transition-all">
      {/* Top Bar Banner - Warm Dark Charcoal with Amber Accents */}
      <div className="bg-stone-950 text-white text-xs py-1.5 px-4 font-medium hidden sm:block border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-amber-400 font-black">ISO 9001:2015</span> Certified Computer Training Institute
            </span>
            <span className="text-stone-300 font-normal">
              {branding.headerNotice || 'Admissions Open for 2026 Batches • Limited Seats'}
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <a
              href={`tel:${(branding.contactPhone || '+919876543210').replace(/\s+/g, '')}`}
              className="flex items-center gap-1.5 hover:text-amber-400 font-bold text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              {branding.contactPhone || '+91 98765 43210'}
            </a>
            <span className="text-stone-400">Lab: 08:00 AM - 08:00 PM</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavClick('/')}
          className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
        >
          {hasCustomLogo ? (
            <div className="flex items-center">
              <img
                src={branding.logoUrl}
                alt={branding.instituteName || 'Institute Logo'}
                onError={() => setLogoLoadError(true)}
                className="h-11 sm:h-12 w-auto max-w-[220px] object-contain group-hover:scale-102 transition-transform"
              />
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-orange-500/20 border border-amber-300 group-hover:scale-105 transition-transform">
                {branding.instituteName ? branding.instituteName.charAt(0).toUpperCase() : 'O'}
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-stone-900 block leading-tight">
                  {branding.instituteName || 'Oritech Computer'}
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-orange-600 block leading-none">
                  {branding.tagline || 'Computer Institute'}
                </span>
              </div>
            </>
          )}
        </button>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-50 text-orange-700 border border-amber-300/80 shadow-xs'
                    : 'text-stone-600 hover:text-orange-600 hover:bg-stone-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-orange-600' : 'text-stone-400'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Auth & CTA Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <AnimatePresence mode="wait">
            {user ? (
              <motion.div
                key="user-logged-in"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <button
                  onClick={() => handleNavClick(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard')}
                  className="flex items-center gap-2 px-3.5 py-2 bg-stone-50 hover:bg-amber-50 text-stone-800 hover:text-orange-950 border border-stone-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-orange-600" />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="user-logged-out"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={() => handleNavClick('/login')}
                  className="px-3.5 py-2 bg-stone-50 hover:bg-amber-50 hover:text-orange-950 text-stone-800 border border-stone-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-orange-600" />
                  <span>Sign In</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={onOpenEnroll}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            Enroll / Enquire
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-stone-700 hover:text-orange-600 rounded-lg hover:bg-stone-100 cursor-pointer"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-5 space-y-3 shadow-lg overflow-hidden"
          >
            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNavClick(link.path)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all ${
                      active ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm' : 'text-stone-700 hover:bg-amber-50/70 hover:text-orange-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-stone-200 space-y-2">
              {user ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleNavClick(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard')}
                    className="w-full py-2.5 bg-stone-100 hover:bg-amber-50 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-stone-200 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-orange-600" />
                    <span>Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-white" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick('/login')}
                  className="w-full py-2.5 bg-stone-100 hover:bg-amber-50 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-stone-200 cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-orange-600" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
