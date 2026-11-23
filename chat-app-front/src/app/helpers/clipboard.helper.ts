/**
 * Robust cross-browser clipboard utility with fallback for non-secure (HTTP / LAN) contexts.
 * In non-secure contexts (e.g. http://localhost, http://<IP>:80), navigator.clipboard is undefined.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  // 1. Try modern async Clipboard API if available and secure
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy fallback on permission rejection or restriction
    }
  }

  // 2. Legacy fallback using a hidden textarea + document.execCommand('copy')
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // Prevent scrolling to bottom of page in MS Edge / Chrome
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, text.length);

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Copies an image to the clipboard as a PNG blob via ClipboardItem.
 * If the source is not a PNG (or is remote/CORS), it converts the image via an offscreen HTMLCanvasElement.
 * Falls back to copying the image URL as text if ClipboardItem is not supported or rejected.
 */
export async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  if (!imageUrl) {
    return false;
  }

  try {
    // Attempt to convert image to a clean PNG blob
    const pngBlob = await convertImageToPngBlob(imageUrl);
    if (pngBlob && typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.write === 'function' && typeof ClipboardItem !== 'undefined') {
      try {
        const item = new ClipboardItem({ 'image/png': pngBlob });
        await navigator.clipboard.write([item]);
        return true;
      } catch (clipErr) {
        console.warn('ClipboardItem write failed, falling back to text URL:', clipErr);
      }
    }
  } catch (err) {
    console.warn('convertImageToPngBlob failed:', err);
  }

  // Fallback to copying URL as plain text
  return await copyToClipboard(imageUrl);
}

/**
 * Loads an image from a URL or Blob and draws it on an offscreen canvas to obtain an image/png Blob.
 */
function convertImageToPngBlob(url: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      // If crossOrigin image loading failed, try fetching as blob directly
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          if (blob.type === 'image/png') {
            resolve(blob);
          } else {
            const objectUrl = URL.createObjectURL(blob);
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              URL.revokeObjectURL(objectUrl);
              const canvas = document.createElement('canvas');
              canvas.width = fallbackImg.naturalWidth || fallbackImg.width;
              canvas.height = fallbackImg.naturalHeight || fallbackImg.height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                resolve(null);
                return;
              }
              ctx.drawImage(fallbackImg, 0, 0);
              canvas.toBlob((pngBlob) => resolve(pngBlob), 'image/png');
            };
            fallbackImg.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              resolve(null);
            };
            fallbackImg.src = objectUrl;
          }
        })
        .catch(() => resolve(null));
    };

    img.src = url;
  });
}

