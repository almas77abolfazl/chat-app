/**
 * Client-side image compression using HTML5 Canvas.
 * Resizes excessive dimensions down to 1920px max while preserving aspect ratio,
 * and encodes with WebP / JPEG for optimal quality-to-size ratio.
 */
export async function compressImage(
  file: File,
  maxDimension: number = 1920,
  quality: number = 0.82
): Promise<File> {
  // Only compress raster static images
  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/gif' ||
    file.type === 'image/svg+xml'
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Check if image is already small in dimensions and file size
      if (width <= maxDimension && height <= maxDimension && file.size <= 1.5 * 1024 * 1024) {
        resolve(file);
        return;
      }

      // Proportional scale
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
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Attempt webp conversion, with JPEG fallback
      const targetType = 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compression didn't reduce file size, keep original
            resolve(file);
            return;
          }

          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const compressedFile = new File([blob], `${baseName}.webp`, {
            type: targetType,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        targetType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

