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
 * Copies an image to the clipboard.
 * 1. Attempts modern async Clipboard API write with image/png ClipboardItem.
 * 2. If Clipboard API write is unsupported/fails or is blocked (e.g. non-secure LAN HTTP),
 *    it copies the image URL as text to clipboard so user still gets the file link.
 */
export async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  if (!imageUrl) {
    return false;
  }

  // Modern async ClipboardItem write
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.write === 'function' &&
    typeof ClipboardItem !== 'undefined'
  ) {
    try {
      const pngBlob = await convertImageToPngBlob(imageUrl);
      if (pngBlob) {
        const item = new ClipboardItem({ 'image/png': pngBlob });
        await navigator.clipboard.write([item]);
        return true;
      }
    } catch (clipErr) {
      console.warn('ClipboardItem write failed, trying text fallback:', clipErr);
    }
  }

  // Universal Fallback: copy image absolute URL to clipboard
  const absoluteUrl = makeAbsoluteUrl(imageUrl);
  return await copyToClipboard(absoluteUrl);
}

function makeAbsoluteUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (typeof window !== 'undefined' && window.location) {
    return new URL(url, window.location.origin).href;
  }
  return url;
}

/**
 * Loads an image from a URL or Blob and draws it on an offscreen canvas to obtain an image/png Blob.
 */
function convertImageToPngBlob(url: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    // First try fetching the image data directly (works cleanly when served on same origin / backend proxy)
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Fetch status ' + res.status);
        return res.blob();
      })
      .then((blob) => {
        if (blob.type === 'image/png') {
          resolve(blob);
          return;
        }
        // If not PNG, convert via offscreen canvas
        const objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((pngBlob) => resolve(pngBlob), 'image/png');
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
        img.src = objectUrl;
      })
      .catch(() => {
        // Fallback: draw via Image with crossOrigin
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
            canvas.toBlob((pngBlob) => resolve(pngBlob), 'image/png');
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
  });
}

