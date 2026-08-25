import React, { useState, useEffect } from 'react';
import { formatImageUrl, getProxyImageUrl } from '../lib/imageUtils';

interface ReviewAvatarProps {
  avatarUrl?: string | null;
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ReviewAvatar: React.FC<ReviewAvatarProps> = ({
  avatarUrl,
  name,
  className = '',
  size = 'md',
}) => {
  // Stage: 0 = Direct/formatted, 1 = Proxy fallback, 2 = Initials fallback
  const [stage, setStage] = useState<number>(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setStage(0);
    setHasError(false);
  }, [avatarUrl]);

  const cleanAvatar = avatarUrl?.trim();
  const directSrc = cleanAvatar ? formatImageUrl(cleanAvatar) : '';
  const proxySrc = cleanAvatar ? getProxyImageUrl(cleanAvatar) : '';

  const currentSrc = stage === 0 ? directSrc : stage === 1 ? proxySrc : '';

  const handleError = () => {
    if (stage === 0 && proxySrc && proxySrc !== directSrc) {
      setStage(1);
    } else {
      setStage(2);
      setHasError(true);
    }
  };

  const getInitials = (n: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 sm:w-14 sm:h-14 text-sm sm:text-base',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 text-base sm:text-lg',
    xl: 'w-20 h-20 text-xl',
  };

  const currentSizeClass = sizeStyles[size] || sizeStyles.md;

  if (!cleanAvatar || hasError || stage === 2 || !currentSrc) {
    return (
      <div
        className={`${currentSizeClass} rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 text-white font-black flex items-center justify-center border-2 border-indigo-400 shrink-0 shadow-md select-none ${className}`}
        title={name}
      >
        <span>{getInitials(name)}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative ${currentSizeClass} rounded-full overflow-hidden border-2 border-indigo-500 shrink-0 shadow-md bg-slate-100 ${className}`}
    >
      <img
        src={currentSrc}
        alt={name}
        referrerPolicy="no-referrer"
        onError={handleError}
        className="w-full h-full object-cover block"
      />
    </div>
  );
};

