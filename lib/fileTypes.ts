import path from 'path';

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',
  '.ico',
  '.avif',
]);

export const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
export const MAX_PDF_BYTES = 80 * 1024 * 1024;

export function isImageFile(name: string, size = 0): boolean {
  if (size > MAX_IMAGE_BYTES) return false;
  return IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase());
}

export function isPdfFile(name: string, size = 0): boolean {
  if (size > MAX_PDF_BYTES) return false;
  return path.extname(name).toLowerCase() === '.pdf';
}

export function getRawFileUrl(filePath: string): string {
  return `/api/files/raw?path=${encodeURIComponent(filePath)}`;
}
