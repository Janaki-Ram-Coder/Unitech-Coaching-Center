/**
 * Converts user-submitted image links (Imghippo, Google Drive, Dropbox, Imgur, Postimages, GitHub, etc.)
 * into directly streamable web image URLs compatible with <img> elements.
 */
export function formatImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  if (!clean) return '';

  // Data URLs (base64) are already direct and fast
  if (clean.startsWith('data:image/')) {
    return clean;
  }

  // Imghippo blocks direct cross-origin browser requests with 403 Forbidden;
  // Route directly to high-speed cached proxy
  if (clean.includes('imghippo.com')) {
    return `/api/proxy-image?url=${encodeURIComponent(clean)}`;
  }

  // Google Drive standard file/view or sharing link
  // Matches: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const gDriveFileMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gDriveFileMatch && gDriveFileMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${gDriveFileMatch[1]}&sz=w1000`;
  }

  // Matches: https://drive.google.com/open?id=FILE_ID or https://drive.google.com/uc?id=FILE_ID
  const gDriveIdMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (clean.includes('drive.google.com') && gDriveIdMatch && gDriveIdMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${gDriveIdMatch[1]}&sz=w1000`;
  }

  // Dropbox shared links
  // e.g. https://www.dropbox.com/s/xyz/photo.jpg?dl=0
  if (clean.includes('dropbox.com')) {
    if (clean.includes('?dl=0')) {
      return clean.replace('?dl=0', '?raw=1');
    }
    if (clean.includes('&dl=0')) {
      return clean.replace('&dl=0', '&raw=1');
    }
    if (!clean.includes('raw=1')) {
      return clean + (clean.includes('?') ? '&raw=1' : '?raw=1');
    }
  }

  // PostImages support
  const postimgMatch = clean.match(/postimg\.cc\/([a-zA-Z0-9_-]+)/i);
  if (postimgMatch && postimgMatch[1] && !clean.includes('i.postimg.cc')) {
    return `/api/proxy-image?url=${encodeURIComponent(clean)}`;
  }

  // Imgur page links without image extension
  // e.g. https://imgur.com/aBcDeFg
  if (clean.includes('imgur.com') && !clean.includes('i.imgur.com') && !clean.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    const parts = clean.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    if (lastPart && !lastPart.includes('.')) {
      return `https://i.imgur.com/${lastPart}.jpg`;
    }
  }

  // GitHub blob links to raw user content
  if (clean.includes('github.com') && clean.includes('/blob/')) {
    return clean.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
  }

  return clean;
}

/**
 * Returns proxy image URL as a high-reliability fallback if direct image loading fails.
 */
export function getProxyImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  if (!clean || clean.startsWith('data:image/')) return clean;
  return `/api/proxy-image?url=${encodeURIComponent(clean)}`;
}

/**
 * Compresses and resizes a user-selected file into a lightweight web-friendly base64 image (max 800px, 85% JPEG).
 */
export function compressImageFile(file: File, maxDimension = 800, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image (File or base64 string) using ImgBB API via the backend `/api/upload-image`
 * endpoint or direct fallback to convert it into a permanent high-resolution web image link.
 */
export async function uploadImageToImgBB(fileOrBase64: File | string, name?: string): Promise<string> {
  let base64String = '';

  if (typeof fileOrBase64 === 'string') {
    base64String = fileOrBase64;
  } else {
    // Read and optimize file if needed
    try {
      base64String = await compressImageFile(fileOrBase64, 1600, 0.9);
    } catch {
      base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBase64);
      });
    }
  }

  // 1. Try Backend Proxy endpoint `/api/upload-image`
  try {
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64String,
        name: name || (typeof fileOrBase64 !== 'string' ? fileOrBase64.name : undefined),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && (data.url || data.imageUrl || data.displayUrl)) {
        return data.url || data.imageUrl || data.displayUrl;
      }
    }
  } catch (backendErr) {
    console.warn('Backend ImgBB route failed, attempting direct API fallback...', backendErr);
  }

  // 2. Direct ImgBB API fallback
  const IMGBB_KEY = 'c7d4b3605cae1a156001d0d39ce38c1f';
  let cleanBase64 = base64String;
  if (cleanBase64.includes(';base64,')) {
    cleanBase64 = cleanBase64.split(';base64,')[1];
  }

  const formData = new FormData();
  formData.append('image', cleanBase64);
  if (name) {
    formData.append('name', name);
  }

  const directRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
    method: 'POST',
    body: formData,
  });

  const directData = await directRes.json();
  if (directData.success && directData.data) {
    return directData.data.url || directData.data.display_url;
  }

  throw new Error(directData?.error?.message || 'Failed to upload image to ImgBB');
}

