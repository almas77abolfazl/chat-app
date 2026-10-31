import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import * as fs from 'fs';

function getAvatarUploadDirectory(): string {
  const candidate1 = resolve(__dirname, '..', '..', 'uploads', 'avatars');
  const candidate2 = resolve(process.cwd(), 'chat-app-back', 'uploads', 'avatars');
  const candidate3 = resolve(process.cwd(), 'uploads', 'avatars');

  let chosen = candidate3;
  if (fs.existsSync(resolve(__dirname, '..', '..', 'uploads'))) {
    chosen = candidate1;
  } else if (fs.existsSync(resolve(process.cwd(), 'chat-app-back', 'uploads'))) {
    chosen = candidate2;
  }
  fs.mkdirSync(chosen, { recursive: true });
  return chosen;
}

export const multerOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      try {
        const dir = getAvatarUploadDirectory();
        cb(null, dir);
      } catch (err: any) {
        cb(err, '');
      }
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname || '');
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .jpg, and .png files are allowed!'), false);
    }
  },
};
