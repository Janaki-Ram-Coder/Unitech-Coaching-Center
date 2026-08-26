import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, ArrowUp } from 'lucide-react';

const CONTACT_PHONE_NUMBER = '9437235124';
const WHATSAPP_LINK = `https://wa.me/91${CONTACT_PHONE_NUMBER}?text=${encodeURIComponent(
  'Hello Oritech Computer, I am interested in course admissions, syllabus details, and batch timings.'
)}`;
const CALL_LINK = `tel:+91${CONTACT_PHONE_NUMBER}`;

export const FloatingContactWidget: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (typeof window !== 'undefined') {
        setShowScrollTop(window.scrollY > 260);
      }
    };
    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const handleScrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      id="floating-contact-widget-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2.5 pointer-events-none select-none"
    >
      {/* 1. Phone Call Button (Top) */}
      <motion.a
        id="floating-call-btn"
        href={CALL_LINK}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Call +91 ${CONTACT_PHONE_NUMBER}`}
        title={`Call Us: +91 ${CONTACT_PHONE_NUMBER}`}
        className="group relative pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 border border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        <Phone className="w-5 h-5 stroke-[2.2]" />

        {/* Hover Tooltip */}
        <span className="hidden sm:block absolute right-14 px-2.5 py-1 rounded-lg bg-stone-900 text-white text-xs font-semibold whitespace-nowrap shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          Call: +91 {CONTACT_PHONE_NUMBER}
        </span>
      </motion.a>

      {/* 2. WhatsApp Button (Middle / After Call) */}
      <motion.a
        id="floating-whatsapp-btn"
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`WhatsApp +91 ${CONTACT_PHONE_NUMBER}`}
        title={`Chat on WhatsApp: ${CONTACT_PHONE_NUMBER}`}
        className="group relative pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-lg shadow-[#25D366]/35 border border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
      >
        {/* Official WhatsApp Brand Icon */}
        <svg
          className="w-6 h-6 text-white fill-white"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.301-.15-1.777-.878-2.052-.978-.276-.1-.477-.15-.678.15-.2.3-.778.978-.953 1.178-.175.2-.35.225-.651.075-.3-.15-1.267-.467-2.413-1.488-.893-.796-1.496-1.78-1.671-2.08-.175-.3-.019-.462.13-.611.136-.134.301-.35.452-.525.15-.175.2-.3.301-.5.1-.2.05-.375-.025-.525-.075-.15-.678-1.635-.929-2.241-.244-.589-.493-.509-.678-.519l-.578-.01c-.2 0-.526.075-.802.375-.276.3-1.053 1.028-1.053 2.508 0 1.48 1.078 2.908 1.229 3.108.15.2 2.121 3.24 5.138 4.542.718.31 1.278.496 1.716.635.722.23 1.379.197 1.9.12.58-.088 1.777-.727 2.028-1.43.25-.703.25-1.306.175-1.43-.075-.125-.276-.2-.577-.35zM12.004 0C5.372 0 0 5.373 0 12c0 2.118.552 4.107 1.517 5.836L0 24l6.347-1.482A11.936 11.936 0 0 0 12.004 24C18.636 24 24 18.627 24 12c0-6.627-5.364-12-11.996-12zm0 21.82a9.78 9.78 0 0 1-4.99-1.369l-.358-.212-3.714.867.986-3.619-.233-.371A9.774 9.774 0 0 1 2.222 12c0-5.394 4.388-9.78 9.782-9.78 5.394 0 9.782 4.386 9.782 9.78 0 5.394-4.388 9.82-9.782 9.82z" />
        </svg>

        {/* Hover Tooltip */}
        <span className="hidden sm:block absolute right-14 px-2.5 py-1 rounded-lg bg-stone-900 text-white text-xs font-semibold whitespace-nowrap shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          WhatsApp: {CONTACT_PHONE_NUMBER}
        </span>
      </motion.a>

      {/* 3. Go To Top Button (Bottom / After WhatsApp) */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            id="floating-scroll-to-top-btn"
            type="button"
            onClick={handleScrollToTop}
            initial={{ opacity: 0, scale: 0.6, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 4 }}
            transition={{ duration: 0.18 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Scroll to top"
            title="Scroll to top"
            className="group relative pointer-events-auto w-10 h-10 rounded-full bg-stone-800 hover:bg-stone-900 text-white shadow-md border border-stone-700/60 flex items-center justify-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />

            {/* Hover Tooltip */}
            <span className="hidden sm:block absolute right-12 px-2 py-1 rounded-lg bg-stone-900 text-white text-[11px] font-semibold whitespace-nowrap shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Back to top
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

