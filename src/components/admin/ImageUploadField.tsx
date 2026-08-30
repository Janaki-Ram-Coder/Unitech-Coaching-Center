import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { uploadImageToImgBB, formatImageUrl } from '../../lib/imageUtils';
import { useToast } from '../../lib/ToastContext';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  helperText?: string;
  namePrefix?: string;
  shape?: 'avatar' | 'banner' | 'certificate' | 'logo' | 'standard';
  allowManualUrl?: boolean;
  maxDimension?: number;
  quality?: number;
  compact?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
  helperText,
  namePrefix = 'image',
  shape = 'standard',
  allowManualUrl = true,
  compact = false,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, JPEG, WebP, GIF, SVG).');
      return;
    }

    if (file.size > 32 * 1024 * 1024) {
      setUploadError('File size exceeds 32MB limit. Please choose a smaller image.');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      const sanitizedName = `${namePrefix.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
      const uploadedUrl = await uploadImageToImgBB(file, sanitizedName);
      onChange(uploadedUrl);
      toast.success('Image Uploaded', 'Image uploaded to ImgBB and converted to link successfully.');
    } catch (err: any) {
      console.error('Upload to ImgBB failed:', err);
      const msg = err?.message || 'Failed to upload image. Please check your connection or try again.';
      setUploadError(msg);
      toast.error('Upload Error', msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedLink(true);
    toast.success('Link Copied', 'Image link copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isImgBBHosted = value.includes('ibb.co');

  return (
    <div className={`space-y-2.5 ${compact ? 'p-3' : 'p-4 sm:p-5'} rounded-2xl bg-slate-50 border border-slate-200 transition-all`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
          <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        </div>
        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/80 self-start sm:self-auto flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>Auto-converts to link via ImgBB</span>
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
      />

      {/* Error Alert */}
      {uploadError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError('')}
            className="text-red-700 hover:text-red-900 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropzone Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => {
          if (!isUploading) fileInputRef.current?.click();
        }}
        className={`relative border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
          compact ? 'p-4' : 'p-5 sm:p-6'
        } ${
          isDragOver
            ? 'border-indigo-600 bg-indigo-50/70 scale-[0.99]'
            : 'border-slate-300 hover:border-indigo-500 bg-white hover:bg-slate-50/60'
        }`}
      >
        {isUploading ? (
          <div className="py-3 flex flex-col items-center justify-center space-y-2.5">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <div className="space-y-0.5 text-center">
              <p className="text-xs sm:text-sm font-extrabold text-indigo-900">
                Uploading Image to ImgBB...
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Converting your file into a permanent web link
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 text-center">
              <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                Click to upload or drag & drop image
              </p>
              <p className="text-[11px] text-slate-500">
                Supports JPG, PNG, WebP, GIF, SVG (Up to 32MB)
              </p>
            </div>
            <button
              type="button"
              className="mt-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 pointer-events-none"
            >
              Choose Image File
            </button>
          </div>
        )}
      </div>

      {/* Preview & Link Bar */}
      {value ? (
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
            {/* Thumbnail Preview depending on Shape */}
            <div
              className={`relative overflow-hidden bg-slate-900 shrink-0 border border-slate-200 shadow-xs ${
                shape === 'avatar'
                  ? 'w-16 h-16 rounded-full'
                  : shape === 'banner'
                  ? 'w-full sm:w-36 h-20 rounded-xl'
                  : shape === 'certificate'
                  ? 'w-full sm:w-28 h-20 rounded-xl'
                  : 'w-full sm:w-24 h-20 rounded-xl'
              }`}
            >
              <img
                src={formatImageUrl(value)}
                alt="Uploaded preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute top-1 left-1">
                <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-[10px] font-bold text-white flex items-center gap-0.5 shadow-xs">
                  <Check className="w-2.5 h-2.5" />
                  <span>Active</span>
                </span>
              </div>
            </div>

            {/* URL Display & Action Buttons */}
            <div className="flex-1 min-w-0 space-y-1.5 w-full">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Image Link ({isImgBBHosted ? 'ImgBB Hosted' : 'Web Link'})</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1.5 border border-slate-200">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                <span className="text-[11px] font-mono text-slate-600 truncate flex-1 select-all">
                  {value}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy link"
                  className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={formatImageUrl(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open image in new tab"
                  className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Manual URL / Options Footer */}
      {allowManualUrl && (
        <div className="pt-1">
          <div className="flex items-center justify-between">
            {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
            <button
              type="button"
              onClick={() => setShowManualUrl((prev) => !prev)}
              className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer ml-auto"
            >
              {showManualUrl ? 'Hide manual link input' : 'Enter image URL manually'}
            </button>
          </div>

          {showManualUrl && (
            <div className="pt-2 animate-in fade-in">
              <input
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
