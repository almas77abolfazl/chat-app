import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const mediaMulterOptions = {
  storage: diskStorage({
    destination: './uploads/media',
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
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
