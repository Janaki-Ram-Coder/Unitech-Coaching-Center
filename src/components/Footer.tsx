import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Clock, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { InstituteBranding } from '../types';
import { fsSubscribeBrandingSettings, DEFAULT_BRANDING } from '../lib/firestoreService';

interface FooterProps {
  onNavigate: (path: string) => void;
  onOpenEnroll: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenEnroll }) => {
  const [branding, setBranding] = useState<InstituteBranding>(DEFAULT_BRANDING);
  const [logoLoadError, setLogoLoadError] = useState(false);

  useEffect(() => {
    const unsub = fsSubscribeBrandingSettings((liveBranding) => {
      setBranding(liveBranding || DEFAULT_BRANDING);
      setLogoLoadError(false);
    });
    return () => unsub();
  }, []);

  const hasCustomLogo = Boolean(branding.logoUrl && branding.logoUrl.trim().length > 0 && !logoLoadError);

  return (
    <footer className="bg-stone-950 border-t-4 border-orange-500 text-stone-300 text-sm pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Brand info */}
          <div className="space-y-4">
            <div>
              {hasCustomLogo ? (
                <div className="pt-1">
                  <img
                    src={branding.logoUrl}
                    alt={branding.instituteName || 'Institute Logo'}
                    onError={() => setLogoLoadError(true)}
                    className="h-14 sm:h-16 w-auto max-w-[240px] object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-orange-500/20 border border-amber-300/30">
                    {branding.instituteName ? branding.instituteName.charAt(0).toUpperCase() : 'O'}
                  </div>
                  <div>
                    <span className="text-xl font-black text-white block">
                      {branding.instituteName || 'Oritech Computer'}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block">
                      {branding.tagline || 'Computer Institute'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Leading computer education & software training institute offering 100% practical hands-on experience, ISO 9001:2015 certified diplomas, and dedicated placement support.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300 bg-stone-900 border border-amber-500/30 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Govt. Recognized Certification</span>
            </div>

            {/* Additional Accreditation/Govt Stamp if distinct from primary logo */}
            {branding.stampUrl && branding.stampUrl !== branding.logoUrl ? (
              <div className="pt-2">
                <img
                  src={branding.stampUrl}
                  alt="Accreditation Seal"
                  className="h-12 w-auto max-w-[160px] object-contain"
                />
              </div>
            ) : null}
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs uppercase font-extrabold text-white tracking-widest mb-4 border-b border-stone-800 pb-2 inline-block">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  › Home Page
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  › About Oritech Computer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/courses')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  › All Computer Courses
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/results')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  › Certificate Verify Portal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-amber-400 transition-colors cursor-pointer">
                  › Contact & Directions
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Featured Programs */}
          <div>
            <h4 className="text-xs uppercase font-extrabold text-white tracking-widest mb-4 border-b border-stone-800 pb-2 inline-block">
              Featured Programs
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-1.5 text-stone-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Python Full Stack & AI</span>
              </li>
              <li className="flex items-center gap-1.5 text-stone-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>MERN Web Development</span>
              </li>
              <li className="flex items-center gap-1.5 text-stone-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Diploma in Computer App (DCA)</span>
              </li>
              <li className="flex items-center gap-1.5 text-stone-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Tally Prime with GST</span>
              </li>
              <li className="flex items-center gap-1.5 text-stone-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Cyber Security & Networking</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Hours */}
          <div className="space-y-3 text-xs text-stone-400">
            <h4 className="text-xs uppercase font-extrabold text-white tracking-widest mb-4 border-b border-stone-800 pb-2 inline-block">
              Institute Info
            </h4>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span>{branding.address || 'Sharma Complex, Beside Hotel Jyoti Mahal, Convent road, New Colony, Rayagada-765001, Odisha'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="font-mono text-stone-300 font-medium">
                {branding.contactPhone || '+91 94372 35124'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Mon - Sat: 07:00 AM - 08:00 PM</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-stone-900 text-center text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {branding.instituteName || 'Oritech Computer'}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-stone-400 font-medium">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">ISO Certification #ORI-88421</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
