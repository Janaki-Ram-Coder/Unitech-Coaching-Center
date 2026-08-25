import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rounded' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rounded',
  width,
  height,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
        return 'rounded-md h-4';
      case 'rectangular':
        return 'rounded-none';
      case 'rounded':
      default:
        return 'rounded-2xl';
    }
  };

  const style: React.CSSProperties = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  return (
    <div
      style={style}
      className={`relative overflow-hidden bg-slate-200/80 animate-pulse ${getVariantClasses()} ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
};

/**
 * Course Card Skeleton (Matches Course Grid Cards)
 */
export const CourseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between p-5 space-y-4">
      {/* Thumbnail Area */}
      <div className="w-full h-44 rounded-2xl bg-slate-200/80 animate-pulse relative overflow-hidden">
        <div className="absolute top-3 left-3 w-20 h-5 rounded-full bg-slate-300/80" />
      </div>

      {/* Content */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="w-24 h-4 rounded-md bg-slate-200 animate-pulse" />
          <div className="w-16 h-4 rounded-md bg-slate-200 animate-pulse" />
        </div>

        {/* Title */}
        <div className="w-4/5 h-6 rounded-lg bg-slate-200 animate-pulse" />

        {/* Description lines */}
        <div className="space-y-1.5">
          <div className="w-full h-3.5 rounded-md bg-slate-100 animate-pulse" />
          <div className="w-3/4 h-3.5 rounded-md bg-slate-100 animate-pulse" />
        </div>

        {/* Metadata */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <div className="w-20 h-4 rounded-md bg-slate-200 animate-pulse" />
          <div className="w-16 h-5 rounded-md bg-slate-200 animate-pulse" />
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-2 flex items-center gap-2">
        <div className="flex-1 h-11 rounded-xl bg-slate-200 animate-pulse" />
        <div className="flex-1 h-11 rounded-xl bg-slate-300 animate-pulse" />
      </div>
    </div>
  );
};

/**
 * Hero Slider Skeleton
 */
export const HeroSliderSkeleton: React.FC = () => {
  return (
    <section className="relative w-full h-[calc(100svh-97px)] min-h-[375px] max-h-[515px] sm:h-[465px] lg:h-[505px] overflow-hidden bg-slate-900 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto px-6 space-y-8 text-center">
        <div className="w-32 h-6 rounded-full bg-slate-800 animate-pulse mx-auto" />
        <div className="w-3/4 h-12 sm:h-16 rounded-2xl bg-slate-800 animate-pulse mx-auto" />
        <div className="w-1/2 h-5 rounded-lg bg-slate-800/80 animate-pulse mx-auto" />
        <div className="pt-8 flex items-center justify-center gap-4">
          <div className="w-44 h-14 rounded-2xl bg-slate-700 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

/**
 * Student Dashboard Skeleton (Profile, Continue Watching, Courses)
 */
export const StudentDashboardSkeleton: React.FC = () => {
  return (
    <div className="pt-4 sm:pt-6 pb-16 px-4 flex flex-col items-center gap-6 max-w-md mx-auto w-full">
      {/* Student Profile Card Skeleton */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 sm:p-8 w-full shadow-xl relative flex flex-col items-center space-y-4">
        {/* Circle Avatar Skeleton */}
        <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 border-slate-200 bg-slate-200 animate-pulse overflow-hidden relative" />

        {/* Student Name Skeleton */}
        <div className="w-48 h-8 rounded-xl bg-slate-200 animate-pulse mt-2" />

        {/* Detail Lines */}
        <div className="w-full mt-3 pt-4 border-t-2 border-slate-100 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="w-20 h-4 rounded-md bg-slate-200 animate-pulse" />
              <div className="w-32 h-4 rounded-md bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Continue Watching Card Skeleton */}
      <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="w-28 h-4 rounded-full bg-slate-200 animate-pulse" />
          <div className="w-16 h-3 rounded-md bg-slate-100 animate-pulse" />
        </div>
        <div className="w-3/4 h-5 rounded-lg bg-slate-200 animate-pulse" />
        <div className="w-full h-2 rounded-full bg-slate-200 animate-pulse" />
        <div className="w-full h-12 rounded-2xl bg-slate-200 animate-pulse mt-2" />
      </div>

      {/* Enrolled Courses Section Skeleton */}
      <div className="w-full space-y-4">
        <div className="w-48 h-5 rounded-lg bg-slate-200 animate-pulse" />
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-20 h-4 rounded-full bg-slate-200 animate-pulse" />
              <div className="w-44 h-5 rounded-lg bg-slate-200 animate-pulse" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse" />
          </div>
          <div className="w-full h-10 rounded-xl bg-slate-100 animate-pulse" />
          <div className="w-full h-12 rounded-2xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

/**
 * Course Learning Page Skeleton (Navbar, 16:9 Video Player, Notes)
 */
export const CourseLearningSkeleton: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-5">
      {/* Header Bar Skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
          <div className="space-y-1.5">
            <div className="w-24 h-3 rounded-md bg-slate-200 animate-pulse" />
            <div className="w-48 h-4 rounded-md bg-slate-300 animate-pulse" />
          </div>
        </div>
        <div className="w-14 h-6 rounded-full bg-slate-200 animate-pulse" />
      </div>

      {/* Video Container Skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="w-56 h-5 rounded-lg bg-slate-200 animate-pulse" />
          <div className="w-24 h-6 rounded-lg bg-slate-100 animate-pulse" />
        </div>
        <div className="w-full aspect-video rounded-2xl bg-slate-900/90 flex items-center justify-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-slate-800 animate-pulse" />
        </div>
      </div>

      {/* Topic Study Notes Skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="w-36 h-5 rounded-lg bg-slate-200 animate-pulse" />
        <div className="space-y-2.5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg bg-red-100 animate-pulse" />
                <div className="w-48 h-4 rounded-md bg-slate-200 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-9 rounded-xl bg-slate-100 animate-pulse" />
                <div className="w-20 h-9 rounded-xl bg-slate-200 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Marksheet Result Skeleton
 */
export const MarksheetSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border-2 border-slate-200 shadow-lg space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="space-y-2">
          <div className="w-36 h-4 rounded-full bg-slate-200 animate-pulse" />
          <div className="w-56 h-6 rounded-lg bg-slate-300 animate-pulse" />
        </div>
        <div className="w-20 h-8 rounded-xl bg-slate-200 animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <div className="w-20 h-3 rounded-md bg-slate-200 animate-pulse" />
            <div className="w-32 h-4 rounded-md bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-100 p-3 flex justify-between">
          <div className="w-24 h-4 rounded-md bg-slate-200 animate-pulse" />
          <div className="w-16 h-4 rounded-md bg-slate-200 animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="w-36 h-3 rounded-md bg-slate-100 animate-pulse" />
              <div className="w-12 h-3 rounded-md bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Course Detail Page Skeleton
 */
export const CourseDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="w-32 h-9 rounded-xl bg-slate-200 animate-pulse" />

        {/* Hero Card Skeleton */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-full md:w-80 h-56 md:h-60 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
          <div className="flex-1 space-y-4 w-full">
            <div className="w-28 h-5 rounded-full bg-slate-200 animate-pulse" />
            <div className="w-3/4 h-8 rounded-xl bg-slate-300 animate-pulse" />
            <div className="space-y-2">
              <div className="w-36 h-4 rounded-md bg-slate-200 animate-pulse" />
              <div className="w-28 h-4 rounded-md bg-slate-200 animate-pulse" />
            </div>
            <div className="w-full h-16 rounded-xl bg-slate-100 animate-pulse" />
            <div className="w-40 h-12 rounded-xl bg-slate-300 animate-pulse" />
          </div>
        </div>

        {/* Outline Skeleton */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4">
          <div className="w-48 h-6 rounded-lg bg-slate-200 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Admin Dashboard Skeleton
 */
export const AdminDashboardSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Skeleton */}
      <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="w-28 h-4 rounded-full bg-slate-200 animate-pulse" />
          <div className="w-56 h-7 rounded-xl bg-slate-300 animate-pulse" />
          <div className="w-80 h-3 rounded-md bg-slate-100 animate-pulse" />
        </div>
        <div className="w-32 h-10 rounded-xl bg-slate-200 animate-pulse" />
      </div>

      {/* 5 Stats Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
            <div className="w-16 h-3 rounded-md bg-slate-200 animate-pulse" />
            <div className="w-12 h-7 rounded-lg bg-slate-300 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Tabs & Table Skeleton */}
      <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-28 h-10 rounded-xl bg-slate-200 animate-pulse shrink-0" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-full h-12 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
};
