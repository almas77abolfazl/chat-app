import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import * as fs from 'fs';

function getMediaUploadDirectory(): string {
  const candidate1 = resolve(__dirname, '..', '..', 'uploads', 'media');
  const candidate2 = resolve(process.cwd(), 'chat-app-back', 'uploads', 'media');
  const candidate3 = resolve(process.cwd(), 'uploads', 'media');

  let chosen = candidate3;
  if (fs.existsSync(resolve(__dirname, '..', '..', 'uploads'))) {
    chosen = candidate1;
  } else if (fs.existsSync(resolve(process.cwd(), 'chat-app-back', 'uploads'))) {
    chosen = candidate2;
  }
  fs.mkdirSync(chosen, { recursive: true });
  return chosen;
}

export const mediaMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      try {
        const dir = getMediaUploadDirectory();
        cb(null, dir);
      } catch (err: any) {
        cb(err, '');
      }
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      let ext = extname(file.originalname || '');
      if (!ext && file.mimetype) {
        const mimeMap: Record<string, string> = {
          'image/jpeg': '.jpg',
          'image/jpg': '.jpg',
          'image/png': '.png',
          'image/webp': '.webp',
          'image/gif': '.gif',
          'audio/ogg': '.ogg',
          'audio/webm': '.webm',
          'audio/mp3': '.mp3',
          'audio/mpeg': '.mp3',
          'audio/wav': '.wav',
          'video/mp4': '.mp4',
          'video/webm': '.webm',
          'application/pdf': '.pdf',
        };
        ext = mimeMap[file.mimetype.toLowerCase()] || '';
      }
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (_req, file, cb) => {
    // Disallow dangerous executable scripts and binaries for security
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.msi', '.com', '.scr', '.pif', '.reg', '.app'];
    const ext = extname(file.originalname || '').toLowerCase();
    if (dangerousExtensions.includes(ext)) {
      cb(new BadRequestException('Executable files are not allowed for security reasons.'), false);
    } else {
      cb(null, true);
    }
  },
};
