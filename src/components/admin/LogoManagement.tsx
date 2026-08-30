import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Check,
  RefreshCw,
} from 'lucide-react';
import { InstituteBranding } from '../../types';
import { fsGetBrandingSettings, fsSaveBrandingSettings, fsSubscribeBrandingSettings, DEFAULT_BRANDING } from '../../lib/firestoreService';
import { useToast } from '../../lib/ToastContext';
import { ImageUploadField } from './ImageUploadField';

interface LogoManagementProps {
  onRefresh?: () => void;
}

export const LogoManagement: React.FC<LogoManagementProps> = ({ onRefresh }) => {
  const toast = useToast();
  const [logoUrl, setLogoUrl] = useState('');
  const [savedLogoUrl, setSavedLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [previewSuccess, setPreviewSuccess] = useState(false);
  const [currentBranding, setCurrentBranding] = useState<InstituteBranding>(DEFAULT_BRANDING);

  useEffect(() => {
    const unsub = fsSubscribeBrandingSettings((liveBranding) => {
      const activeUrl = liveBranding?.logoUrl || '';
      setCurrentBranding(liveBranding || DEFAULT_BRANDING);
      setSavedLogoUrl(activeUrl);
      setLogoUrl((prev) => (prev === '' ? activeUrl : prev));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // When user types or changes the URL, reset error state
  const handleUrlChange = (value: string) => {
    setLogoUrl(value);
    setPreviewError(false);
    setPreviewSuccess(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const trimmed = logoUrl.trim();
      const updated = await fsSaveBrandingSettings({
        logoUrl: trimmed,
      });

      setSavedLogoUrl(trimmed);
      setLogoUrl(trimmed);
      toast.success(
        trimmed ? 'Logo Updated Successfully' : 'Logo Cleared',
        trimmed
          ? 'The new institute logo has been applied to the Navbar, Footer, and Sign In screens.'
          : 'Custom logo removed. Default branding restored across all pages.'
      );

      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to save logo link', err);
      toast.error('Save Failed', err.message || 'Could not update logo link. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setLogoUrl('');
    setPreviewError(false);
    setPreviewSuccess(false);
    setSaving(true);
    try {
      await fsSaveBrandingSettings({
        logoUrl: '',
      });
      setSavedLogoUrl('');
      toast.info('Logo Cleared', 'Default institute branding will be shown.');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error('Error', 'Could not clear logo.');
    } finally {
      setSaving(false);
    }
  };

  const hasEnteredUrl = logoUrl.trim().length > 0;
  const isDirty = logoUrl.trim() !== savedLogoUrl.trim();

  if (loading) {
    return (
      <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center shadow-xs">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-stone-600">Loading logo configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300 text-orange-600 flex items-center justify-center shrink-0 shadow-xs">
              <ImageIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  Institute Logo
                </h2>
                {savedLogoUrl ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-300">
                    Default Badge
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-medium mt-1">
                Configure the logo link for the entire application. Updating this single field changes the logo in the top Navbar, Footer, and Sign In portal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Single-Field Form Card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* THE SINGLE REQUIRED FIELD: LOGO IMAGE UPLOADER */}
          <div>
            <ImageUploadField
              label="Institute Brand Logo"
              value={logoUrl}
              onChange={handleUrlChange}
              shape="logo"
              namePrefix="institute-logo"
              helperText="Upload transparent PNG or SVG logo for top Navbar, Footer, and Sign-in screens."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Logo...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Logo Link</span>
                  </>
                )}
              </button>

              {savedLogoUrl && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={saving}
                  className="px-4 py-3 bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700 border border-stone-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Logo</span>
                </button>
              )}
            </div>

            {savedLogoUrl && (
              <span className="text-[11px] text-stone-400 font-mono">
                Saved & Synced to Firestore
              </span>
            )}
          </div>
        </form>

        {/* Live Visual Previews of the Logo on Light and Dark Contexts */}
        {hasEnteredUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-6 border-t border-stone-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
                  Live Placements Preview
                </h3>
              </div>
              <span className="text-[11px] text-stone-500 font-medium">
                Real-time appearance across sections
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Main Navbar Preview (Light background) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-extrabold text-stone-600 uppercase tracking-wider block">
                  1. Main Navbar (Light)
                </span>
                <div className="h-20 bg-white border border-stone-200 rounded-xl px-4 flex items-center justify-center shadow-xs">
                  <img
                    src={logoUrl}
                    alt="Navbar Preview"
                    onError={() => setPreviewError(true)}
                    onLoad={() => {
                      setPreviewError(false);
                      setPreviewSuccess(true);
                    }}
                    className="max-h-12 max-w-full object-contain"
                  />
                </div>
              </div>

              {/* 2. Sign In Page Preview (Clean Card) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-extrabold text-stone-600 uppercase tracking-wider block">
                  2. Sign In Page (Auth)
                </span>
                <div className="h-20 bg-white border border-stone-200 rounded-xl p-3 flex flex-col items-center justify-center shadow-xs">
                  <img
                    src={logoUrl}
                    alt="Sign In Preview"
                    onError={() => setPreviewError(true)}
                    className="max-h-12 max-w-full object-contain"
                  />
                </div>
              </div>

              {/* 3. Footer Preview (Dark Charcoal background) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-extrabold text-stone-600 uppercase tracking-wider block">
                  3. Footer (Dark)
                </span>
                <div className="h-20 bg-stone-950 border border-stone-800 rounded-xl px-4 flex items-center justify-center shadow-xs">
                  <img
                    src={logoUrl}
                    alt="Footer Preview"
                    onError={() => setPreviewError(true)}
                    className="max-h-12 max-w-full object-contain"
                  />
                </div>
              </div>
            </div>

            {previewError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Image load error</p>
                  <p className="text-[11px] text-red-600 mt-0.5">
                    The image at this URL could not be loaded. Please ensure the link is a direct public image link (e.g. ends with .png, .jpg or is a publicly accessible URL).
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
