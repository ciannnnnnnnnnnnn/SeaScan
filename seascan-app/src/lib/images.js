// src/lib/images.js
// Photo rules shared by every upload in SeaScan (Scanner, sighting form).

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
export const ACCEPT_ATTR = 'image/jpeg,image/png';
export const MAX_UPLOAD_MB = 10;

/**
 * Check what the user picked or dropped. Returns an error message to show,
 * or null when exactly one JPEG/PNG photo under the size limit was given.
 */
export function validatePhotoFiles(fileList) {
  const files = Array.from(fileList || []);
  if (files.length === 0) return 'No file was selected.';
  if (files.length > 1) return 'Please choose one photo at a time.';

  const file = files[0];
  if (file.type.startsWith('video/')) {
    return 'Videos are not supported. Please choose a still photo (JPEG or PNG).';
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    const kind = file.type || file.name.split('.').pop()?.toUpperCase() || 'This file';
    return `${kind} files are not supported. Please choose a JPEG or PNG photo.`;
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `This photo is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_MB} MB.`;
  }
  if (file.size === 0) return 'This file is empty.';
  return null;
}

/**
 * Re-encode a photo as a fresh JPEG. Drawing it onto a canvas keeps only the
 * pixels, so all EXIF metadata (camera GPS, device, time) is dropped; the
 * browser applies the EXIF rotation first, so the photo stays upright.
 * The longest side is capped to keep uploads small.
 */
export async function stripMetadata(file, maxSide = 2048, quality = 0.88) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not prepare the photo.'))), 'image/jpeg', quality)
    );
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
