import React, { useState, useEffect, useMemo } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Check,
  X,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  Copy,
  Link2,
  Play,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Maximize2,
  Info,
} from 'lucide-react';
import { SliderImage } from '../../types';
import { useToast } from '../../lib/ToastContext';
import { ImageUploadField } from './ImageUploadField';
import { formatImageUrl } from '../../lib/imageUtils';
import {
  fsGetSliderImages,
  fsSaveSliderImage,
  fsUpdateSliderImage,
  fsDeleteSliderImage,
  fsSaveSliderImages,
  fsSubscribeSliderImages,
} from '../../lib/firestoreService';

interface BannerManagementProps {
  onRefresh?: () => void;
}

interface MultiBannerRow {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  active: boolean;
  order: number;
  isValidUrl?: boolean;
}

export const BannerManagement: React.FC<BannerManagementProps> = ({ onRefresh }) => {
  const toast = useToast();
  const [banners, setBanners] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMultiAddModalOpen, setIsMultiAddModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<SliderImage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SliderImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Single Form State (Only Link Allowed)
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formCtaText, setFormCtaText] = useState('Explore Courses');
  const [formCtaLink, setFormCtaLink] = useState('/courses');
  const [formActive, setFormActive] = useState(true);
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Multi-Banner Form State
  const [multiRows, setMultiRows] = useState<MultiBannerRow[]>([
    {
      id: `row-${Date.now()}-1`,
      imageUrl: '',
      title: '',
      subtitle: '',
      ctaText: 'Explore Courses',
      ctaLink: '/courses',
      active: true,
      order: 1,
    },
    {
      id: `row-${Date.now()}-2`,
      imageUrl: '',
      title: '',
      subtitle: '',
      ctaText: 'Enroll Now',
      ctaLink: '/contact',
      active: true,
      order: 2,
    },
  ]);
  const [multiPasteText, setMultiPasteText] = useState('');
  const [showMultiPasteInput, setShowMultiPasteInput] = useState(false);
  const [multiSubmitting, setMultiSubmitting] = useState(false);

  // Live Carousel Preview state inside preview modal
  const [previewCurrentIndex, setPreviewCurrentIndex] = useState(0);

  // Subscribe to live Firestore banners
  useEffect(() => {
    setLoading(true);
    const unsub = fsSubscribeSliderImages((liveBanners) => {
      setBanners(liveBanners || []);
      setLoading(false);
    });

    fetchBanners();

    return () => unsub();
  }, []);

  const fetchBanners = async () => {
    setIsRefreshing(true);
    try {
      const data = await fsGetSliderImages();
      setBanners(data || []);
    } catch (err: any) {
      console.error('Error fetching banners:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  // Helper to test if a string is a valid HTTP/HTTPS URL
  const isValidUrl = (url: string) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//');
  };

  // Open Add Single Banner modal
  const handleOpenAddModal = () => {
    setFormImageUrl('');
    setFormTitle('');
    setFormSubtitle('');
    setFormCtaText('Explore Courses');
    setFormCtaLink('/courses');
    setFormActive(true);
    setFormOrder((banners.length > 0 ? Math.max(...banners.map((b) => b.order || 1)) + 1 : 1));
    setEditingBanner(null);
    setActionError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Banner modal
  const handleOpenEditModal = (banner: SliderImage) => {
    setFormImageUrl(banner.imageUrl || '');
    setFormTitle(banner.title || '');
    setFormSubtitle(banner.subtitle || '');
    setFormCtaText(banner.ctaText || 'Explore Courses');
    setFormCtaLink(banner.ctaLink || '/courses');
    setFormActive(banner.active !== undefined ? banner.active : true);
    setFormOrder(banner.order || 1);
    setEditingBanner(banner);
    setActionError('');
    setIsAddModalOpen(true);
  };

  // Open Multi-Banner Add modal
  const handleOpenMultiAddModal = () => {
    const nextOrderStart = banners.length > 0 ? Math.max(...banners.map((b) => b.order || 1)) + 1 : 1;
    setMultiRows([
      {
        id: `row-${Date.now()}-1`,
        imageUrl: '',
        title: '',
        subtitle: '',
        ctaText: 'Explore Courses',
        ctaLink: '/courses',
        active: true,
        order: nextOrderStart,
      },
      {
        id: `row-${Date.now()}-2`,
        imageUrl: '',
        title: '',
        subtitle: '',
        ctaText: 'Enroll Now',
        ctaLink: '/contact',
        active: true,
        order: nextOrderStart + 1,
      },
    ]);
    setMultiPasteText('');
    setShowMultiPasteInput(false);
    setActionError('');
    setIsMultiAddModalOpen(true);
  };

  // Add new blank row in multi-banner modal
  const handleAddMultiRow = () => {
    const nextOrder = multiRows.length > 0 ? Math.max(...multiRows.map((r) => r.order || 1)) + 1 : banners.length + 1;
    setMultiRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${prev.length + 1}`,
        imageUrl: '',
        title: '',
        subtitle: '',
        ctaText: 'Explore Courses',
        ctaLink: '/courses',
        active: true,
        order: nextOrder,
      },
    ]);
  };

  // Remove a row from multi-banner modal
  const handleRemoveMultiRow = (rowId: string) => {
    if (multiRows.length <= 1) {
      toast.warning('At least one row required', 'You must have at least one banner row.');
      return;
    }
    setMultiRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  // Update specific row in multi-banner modal
  const handleUpdateMultiRow = (rowId: string, field: keyof MultiBannerRow, value: any) => {
    setMultiRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    );
  };

  // Parse bulk pasted URLs
  const handleApplyPastedUrls = () => {
    if (!multiPasteText.trim()) return;

    const lines = multiPasteText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && isValidUrl(l));

    if (lines.length === 0) {
      toast.error('No Valid URLs', 'Please enter valid http:// or https:// image links.');
      return;
    }

    const nextOrderStart = banners.length > 0 ? Math.max(...banners.map((b) => b.order || 1)) + 1 : 1;

    const newRows: MultiBannerRow[] = lines.map((url, idx) => ({
      id: `bulk-${Date.now()}-${idx}`,
      imageUrl: url,
      title: `Special Course Offer & Certification`,
      subtitle: `Master technical skills with practical lab projects and job-ready certifications.`,
      ctaText: 'Explore Courses',
      ctaLink: '/courses',
      active: true,
      order: nextOrderStart + idx,
    }));

    setMultiRows(newRows);
    setShowMultiPasteInput(false);
    setMultiPasteText('');
    toast.success('URLs Loaded', `Parsed ${lines.length} banner image link(s). You can now customize titles and submit.`);
  };

  // Submit Single Banner
  const handleSubmitSingleBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');

    if (!formImageUrl.trim()) {
      setActionError('Image link URL is required.');
      toast.error('Image Link Required', 'Please provide a valid image URL for the banner.');
      return;
    }

    if (!isValidUrl(formImageUrl)) {
      setActionError('Please enter a valid HTTP or HTTPS image URL link.');
      toast.error('Invalid URL', 'Only valid web image links (http:// or https://) are accepted.');
      return;
    }

    setFormSubmitting(true);
    try {
      const bannerData: SliderImage = {
        id: editingBanner ? editingBanner.id : `banner-${Date.now()}`,
        imageUrl: formImageUrl.trim(),
        title: formTitle.trim() || 'Transform Your Career With Industry Certifications',
        subtitle: formSubtitle.trim() || 'Hands-on practical training with certified instructors and live lab projects.',
        ctaText: formCtaText.trim() || 'Explore Courses',
        ctaLink: formCtaLink.trim() || '/courses',
        active: formActive,
        order: Number(formOrder) || 1,
      };

      if (editingBanner) {
        await fsUpdateSliderImage(editingBanner.id, bannerData);
        toast.success('Banner Updated', 'Hero banner updated successfully in Firestore.');
      } else {
        await fsSaveSliderImage(bannerData);
        toast.success('Banner Published', 'New banner link saved and added to hero carousel.');
      }

      setIsAddModalOpen(false);
      await fetchBanners();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      const msg = err?.message || 'Failed to save banner.';
      setActionError(msg);
      toast.error('Error Saving Banner', msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Multiple Banners in Batch
  const handleSubmitMultipleBanners = async () => {
    setActionError('');
    const validRows = multiRows.filter((r) => r.imageUrl && r.imageUrl.trim() && isValidUrl(r.imageUrl));

    if (validRows.length === 0) {
      setActionError('Please provide at least one valid image URL link.');
      toast.error('No Valid Links', 'Enter valid image URLs for the banners you want to add.');
      return;
    }

    setMultiSubmitting(true);
    try {
      const newBanners: SliderImage[] = validRows.map((r, index) => ({
        id: `banner-${Date.now()}-${index}`,
        imageUrl: r.imageUrl.trim(),
        title: r.title.trim() || 'Upgrade Your Skills with Practical Lab Courses',
        subtitle: r.subtitle.trim() || 'Industry certified training programs designed for students and professionals.',
        ctaText: r.ctaText.trim() || 'Explore Courses',
        ctaLink: r.ctaLink.trim() || '/courses',
        active: r.active !== undefined ? r.active : true,
        order: Number(r.order) || (banners.length + index + 1),
      }));

      // Save all banners into Firestore
      for (const b of newBanners) {
        await fsSaveSliderImage(b);
      }

      toast.success('Multiple Banners Added', `Successfully added ${newBanners.length} banner(s) to Firestore.`);
      setIsMultiAddModalOpen(false);
      await fetchBanners();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      const msg = err?.message || 'Failed to save multiple banners.';
      setActionError(msg);
      toast.error('Error Saving Banners', msg);
    } finally {
      setMultiSubmitting(false);
    }
  };

  // Toggle Banner Active Status
  const handleToggleActive = async (banner: SliderImage) => {
    const nextStatus = !banner.active;
    try {
      await fsUpdateSliderImage(banner.id, { active: nextStatus });
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, active: nextStatus } : b))
      );
      toast.success(
        nextStatus ? 'Banner Activated' : 'Banner Deactivated',
        `Banner is now ${nextStatus ? 'visible' : 'hidden'} on the homepage.`
      );
    } catch (err: any) {
      toast.error('Update Failed', err?.message || 'Could not update banner status.');
    }
  };

  // Move Order (Up / Down)
  const handleMoveOrder = async (banner: SliderImage, direction: 'up' | 'down') => {
    const sorted = [...banners].sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIndex = sorted.findIndex((b) => b.id === banner.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const currentBanner = sorted[currentIndex];
    const targetBanner = sorted[targetIndex];

    const currentOrder = currentBanner.order || 1;
    const targetOrder = targetBanner.order || 1;

    try {
      await Promise.all([
        fsUpdateSliderImage(currentBanner.id, { order: targetOrder }),
        fsUpdateSliderImage(targetBanner.id, { order: currentOrder }),
      ]);
      await fetchBanners();
      toast.success('Reordered', 'Banner carousel sequence updated.');
    } catch (err: any) {
      toast.error('Reorder Failed', err?.message || 'Could not update banner order.');
    }
  };

  // Delete Banner Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fsDeleteSliderImage(deleteTarget.id);
      setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success('Banner Deleted', 'Banner removed from Firestore database.');
      setDeleteTarget(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error('Delete Failed', err?.message || 'Could not delete banner.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Sorted Banners for display
  const sortedBanners = useMemo(() => {
    return [...banners].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [banners]);

  const activeCount = banners.filter((b) => b.active).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Control Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <ImageIcon className="w-4 h-4" />
              <span>Hero Slider & Banners</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Homepage Banner Management
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl font-medium leading-relaxed">
              Add and manage promotional hero banners. <span className="font-bold text-slate-700">Only image URL links</span> are accepted for high-speed cloud CDN loading.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setPreviewCurrentIndex(0);
                setIsPreviewModalOpen(true);
              }}
              disabled={banners.length === 0}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Preview how banners look in the hero carousel"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              <span>Live Carousel Preview</span>
            </button>

            <button
              type="button"
              onClick={handleOpenMultiAddModal}
              className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer border border-indigo-200/80"
              title="Add multiple banner links in batch"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Add Multiple Banners</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Banner Link</span>
            </button>
          </div>
        </div>

        {/* Status Indicators & Link Notice */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center gap-1.5">
              <span>Total Banners:</span>
              <span className="text-slate-900 font-black">{banners.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold flex items-center gap-1.5 border border-emerald-200/70">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active in Carousel:</span>
              <span className="text-emerald-950 font-black">{activeCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50/90 border border-amber-200/70 px-3.5 py-1.5 rounded-xl">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Link format only: paste image web URLs (HTTP/HTTPS)</span>
          </div>
        </div>
      </div>

      {/* Main Banner List / Cards View */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600">Loading hero banners from Firestore...</p>
        </div>
      ) : sortedBanners.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 sm:p-16 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900">No Banners Published Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Add banner image URL links to showcase coaching programs, admissions announcements, and offers on the homepage carousel.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleOpenMultiAddModal}
              className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Add Multiple Banners</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Banner Link</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedBanners.map((banner, index) => (
            <div
              key={banner.id}
              className={`bg-white border rounded-3xl overflow-hidden transition-all shadow-xs flex flex-col justify-between ${
                banner.active ? 'border-slate-200' : 'border-slate-200/60 opacity-75 bg-slate-50/50'
              }`}
            >
              <div>
                {/* Banner Image Preview Container */}
                <div className="relative aspect-21/9 sm:aspect-16/7 w-full bg-slate-950 overflow-hidden group">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback placeholder if link breaks
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80';
                    }}
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur text-white text-[10px] font-black border border-white/20">
                      Slot #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(banner)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-black tracking-wide cursor-pointer transition-all ${
                        banner.active
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {banner.active ? '● Active' : '○ Disabled'}
                    </button>
                  </div>

                  {/* Overlay Title & Subtitle Preview */}
                  <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                    <h4 className="text-sm font-black drop-shadow line-clamp-1">{banner.title}</h4>
                    <p className="text-[11px] text-slate-200 font-medium drop-shadow line-clamp-1 mt-0.5">
                      {banner.subtitle}
                    </p>
                  </div>
                </div>

                {/* Banner Metadata & Content */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Headline</span>
                    </div>
                    <p className="text-xs font-black text-slate-900 line-clamp-2">{banner.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 font-medium">{banner.subtitle}</p>
                  </div>

                  {/* CTA Details */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold min-w-0">
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold">CTA:</span>
                      <span className="truncate">{banner.ctaText || 'Explore Courses'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold truncate ml-2">
                      <span className="truncate">{banner.ctaLink || '/courses'}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </div>
                  </div>

                  {/* Direct Image Link Display & Copy */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100/70 border border-slate-200/80 text-[11px] text-slate-600">
                    <Link2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate font-mono select-all flex-1">{banner.imageUrl}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(banner.imageUrl);
                        toast.success('Link Copied', 'Image URL copied to clipboard.');
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Copy URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                {/* Reordering Up / Down */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveOrder(banner, 'up')}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                    title="Move banner earlier in carousel"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === sortedBanners.length - 1}
                    onClick={() => handleMoveOrder(banner, 'down')}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                    title="Move banner later in carousel"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Edit and Delete */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(banner)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(banner)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT SINGLE BANNER (STRICTLY ACCEPTS IMAGE LINK)            */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {editingBanner ? 'Edit Hero Banner' : 'Add Banner via Image Link'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Only accepts image links (URLs). No file upload required.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSingleBanner} className="space-y-4">
              {/* Banner Image Upload */}
              <ImageUploadField
                label="Banner Background Image"
                value={formImageUrl}
                onChange={setFormImageUrl}
                required
                shape="banner"
                namePrefix="homepage-banner"
                helperText="Upload high-resolution banner (16:9 or 21:9 landscape) or enter direct image URL."
              />

              {/* Live Preview Box */}
              {formImageUrl && isValidUrl(formImageUrl) && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase text-slate-400">
                    Live URL Preview
                  </label>
                  <div className="relative aspect-21/9 rounded-2xl overflow-hidden bg-slate-950 border border-slate-200">
                    <img
                      src={formImageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                      <p className="text-xs font-black drop-shadow line-clamp-1">{formTitle || 'Headline Preview'}</p>
                      <p className="text-[10px] text-slate-200 drop-shadow line-clamp-1">{formSubtitle || 'Subtitle Preview'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Headline Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Headline Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master Full Stack Web Development & Cloud AI"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-xs sm:text-sm font-medium transition-all"
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Subtitle / Tagline</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 100% practical lab training with industry veteran faculty & recognized certificates."
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-xs sm:text-sm font-medium transition-all resize-none"
                />
              </div>

              {/* CTA Text & CTA Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Button CTA Text</label>
                  <input
                    type="text"
                    placeholder="Explore Courses"
                    value={formCtaText}
                    onChange={(e) => setFormCtaText(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-indigo-500 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Button Target Link</label>
                  <input
                    type="text"
                    placeholder="/courses or /contact"
                    value={formCtaLink}
                    onChange={(e) => setFormCtaLink(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-indigo-500 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Active Switch & Slot Order */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="formActive"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <label htmlFor="formActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Publish actively in Homepage Carousel
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Order:</span>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)}
                    className="w-14 px-2 py-1 rounded-lg border border-slate-200 text-center text-xs font-black"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-extrabold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingBanner ? 'Save Changes' : 'Publish Banner Link'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BATCH / ADD MULTIPLE BANNERS (STRICTLY IMAGE LINKS)              */}
      {/* ========================================================================= */}
      {isMultiAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Add Multiple Banners in Batch
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Add several banner image links at once. Supports individual rows or bulk URL pasting.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMultiAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Mode Toggle & Bulk Paste Box */}
            <div className="space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">Banner Links List ({multiRows.length} items)</span>
                <button
                  type="button"
                  onClick={() => setShowMultiPasteInput(!showMultiPasteInput)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{showMultiPasteInput ? 'Hide Bulk Paste' : 'Bulk Paste Multiple URLs'}</span>
                </button>
              </div>

              {showMultiPasteInput && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/70 space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-bold text-indigo-950 mb-1">
                      Paste Multiple Image Links (One URL per line):
                    </label>
                    <textarea
                      rows={3}
                      value={multiPasteText}
                      onChange={(e) => setMultiPasteText(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-1&#10;https://images.unsplash.com/photo-2&#10;https://images.unsplash.com/photo-3"
                      className="w-full p-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleApplyPastedUrls}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Parse & Load Links into Rows</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Rows Container */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {multiRows.map((row, idx) => (
                <div
                  key={row.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 text-slate-800 text-[10px] font-black">
                      Banner Slot #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMultiRow(row.id)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Row Image Upload Field */}
                  <ImageUploadField
                    label={`Slot #${idx + 1} Image`}
                    value={row.imageUrl}
                    onChange={(val) => handleUpdateMultiRow(row.id, 'imageUrl', val)}
                    required
                    shape="banner"
                    namePrefix={`banner-slot-${idx + 1}`}
                    compact
                  />

                  {/* Row Title & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500">Headline Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Master Full Stack Web Development"
                        value={row.title}
                        onChange={(e) => handleUpdateMultiRow(row.id, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500">Subtitle / Tagline</label>
                      <input
                        type="text"
                        placeholder="e.g. Hands-on practical lab training & certification"
                        value={row.subtitle}
                        onChange={(e) => handleUpdateMultiRow(row.id, 'subtitle', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Row CTA and Thumbnail Preview */}
                  {row.imageUrl && isValidUrl(row.imageUrl) && (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-20 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-200 shrink-0">
                        <img
                          src={row.imageUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Valid Link Preview Ready
                      </span>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddMultiRow}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/40 text-slate-600 hover:text-indigo-600 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Banner Row</span>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-slate-500 font-medium">
                Ready to publish <span className="font-bold text-slate-800">{multiRows.filter((r) => r.imageUrl && isValidUrl(r.imageUrl)).length}</span> valid banner link(s)
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMultiAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitMultipleBanners}
                  disabled={multiSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-extrabold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {multiSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Publishing Banners...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Publish All Banners</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LIVE HERO CAROUSEL PREVIEW SIMULATOR                             */}
      {/* ========================================================================= */}
      {isPreviewModalOpen && sortedBanners.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-800 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Play className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black">Live Homepage Carousel Simulator</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Carousel Frame */}
            <div className="relative aspect-21/9 sm:aspect-16/7 w-full rounded-2xl overflow-hidden bg-black border border-slate-800">
              {sortedBanners.map((slide, sIdx) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    sIdx === previewCurrentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover opacity-75"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <h2 className="text-xl sm:text-3xl font-black text-white max-w-2xl drop-shadow-md">
                      {slide.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-xl drop-shadow font-medium">
                      {slide.subtitle}
                    </p>
                    <div className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md">
                      {slide.ctaText || 'Explore Courses'}
                    </div>
                  </div>
                </div>
              ))}

              {/* Arrow controls */}
              <button
                type="button"
                onClick={() =>
                  setPreviewCurrentIndex(
                    (prev) => (prev - 1 + sortedBanners.length) % sortedBanners.length
                  )
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPreviewCurrentIndex((prev) => (prev + 1) % sortedBanners.length)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
                {sortedBanners.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => setPreviewCurrentIndex(dotIdx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      dotIdx === previewCurrentIndex ? 'w-6 bg-indigo-500' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-400">
              Showing Banner {previewCurrentIndex + 1} of {sortedBanners.length}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE BANNER CONFIRMATION                                       */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">Delete Banner Link?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to remove this banner? It will be deleted from your Firestore database and will no longer show on the homepage.
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-bold text-slate-800 truncate">
                {deleteTarget.title}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all shadow-md shadow-rose-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
