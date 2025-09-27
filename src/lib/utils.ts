// src/lib/utils.ts (or src/utils/index.ts)
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names using clsx and tailwind-merge
 * Handles conditional classes and removes Tailwind conflicts
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Downloads an image from a data URL
 * @param dataUrl - The data URL of the image
 * @param filename - The filename for the downloaded file (default: 'snap-mix-image.png')
 */
export function downloadImage(
  dataUrl: string, 
  filename: string = 'snap-mix-image.png'
): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copies an image to the clipboard from a data URL
 * @param dataUrl - The data URL of the image to copy
 * @returns Promise that resolves to true if successful
 * @throws Error if clipboard API is not supported or copy fails
 */
export function copyToClipboard(dataUrl: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Check if Clipboard API is supported
    if (!navigator.clipboard || !navigator.clipboard.write) {
      reject(new Error('Clipboard API is not supported in this browser'));
      return;
    }

    fetch(dataUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch image: ${res.statusText}`);
        }
        return res.blob();
      })
      .then((blob) => {
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]).then(
            () => resolve(true),
            (err) => reject(err)
          );
        } catch (err) {
          reject(err);
        }
      })
      .catch((err) => reject(err));
  });
}

/**
 * Merges two canvas elements side by side into a single image
 * @param leftCanvas - Canvas element for the left side
 * @param rightCanvas - Canvas element for the right side
 * @returns Data URL of the merged image
 * @throws Error if canvas context cannot be obtained
 */
export function mergeImages(
  leftCanvas: HTMLCanvasElement, 
  rightCanvas: HTMLCanvasElement
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Unable to get 2D rendering context from canvas');
  }
  
  // Set canvas size to fit both images side by side
  canvas.width = leftCanvas.width + rightCanvas.width;
  canvas.height = Math.max(leftCanvas.height, rightCanvas.height);
  
  // Draw left image
  ctx.drawImage(leftCanvas, 0, 0);
  
  // Draw right image
  ctx.drawImage(rightCanvas, leftCanvas.width, 0);
  
  return canvas.toDataURL('image/png');
}

// Additional utility types you might need
export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp';

/**
 * Enhanced version with configurable image format
 */
export function mergeImagesWithFormat(
  leftCanvas: HTMLCanvasElement,
  rightCanvas: HTMLCanvasElement,
  format: ImageFormat = 'image/png',
  quality?: number
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Unable to get 2D rendering context from canvas');
  }
  
  canvas.width = leftCanvas.width + rightCanvas.width;
  canvas.height = Math.max(leftCanvas.height, rightCanvas.height);
  
  ctx.drawImage(leftCanvas, 0, 0);
  ctx.drawImage(rightCanvas, leftCanvas.width, 0);
  
  return canvas.toDataURL(format, quality);
}