import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function downloadImage(dataUrl, filename = 'snap-mix-image.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function copyToClipboard(dataUrl) {
  return new Promise((resolve, reject) => {
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
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
      .catch(err => reject(err));
  });
}

export function mergeImages(leftCanvas, rightCanvas) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size to fit both images side by side
  canvas.width = leftCanvas.width + rightCanvas.width;
  canvas.height = Math.max(leftCanvas.height, rightCanvas.height);
  
  // Draw left image
  ctx.drawImage(leftCanvas, 0, 0);
  
  // Draw right image
  ctx.drawImage(rightCanvas, leftCanvas.width, 0);
  
  return canvas.toDataURL('image/png');
}