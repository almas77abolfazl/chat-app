import * as sharp from 'sharp';
import * as fs from 'fs';
import { extname } from 'path';

export interface ResizeOptions {
  width?: number;
  height?: number;
  quality?: number;
}

export async function resizeAvatar(inputPath: string, outputPath: string, options: ResizeOptions = {}): Promise<void> {
  const { width = 500, height = 500, quality = 85 } = options;

  const sharpModule: any = sharp;
  const sharpFn = typeof sharpModule === 'function' ? sharpModule : sharpModule.default;
  const pipeline = sharpFn(inputPath).resize(width, height, {
    fit: 'cover',
    position: 'centre',
  });

  const ext = extname(outputPath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') {
    pipeline.jpeg({ quality });
  } else if (ext === '.png') {
    pipeline.png({ quality });
  } else if (ext === '.webp') {
    pipeline.webp({ quality });
  }

  await pipeline.toFile(outputPath);
  try {
    if (fs.existsSync(inputPath) && inputPath !== outputPath) {
      fs.unlinkSync(inputPath);
    }
  } catch {}
}
