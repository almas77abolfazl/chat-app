import { resizeAvatar } from './avatar-resize';
import * as fs from 'fs';
import * as path from 'path';

let lastMockInstance: {
  resize: jest.Mock;
  jpeg: jest.Mock;
  png: jest.Mock;
  webp: jest.Mock;
  toFile: jest.Mock;
};

jest.mock('sharp', () => {
  const mockFn = jest.fn().mockImplementation(() => {
    lastMockInstance = {
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      webp: jest.fn().mockReturnThis(),
      toFile: jest.fn().mockResolvedValue(undefined),
    };
    return lastMockInstance;
  });
  return { __esModule: true, default: mockFn };
});

/* eslint-disable @typescript-eslint/no-require-imports */
const mockSharp: jest.Mock = require('sharp').default;
/* eslint-enable @typescript-eslint/no-require-imports */

describe('resizeAvatar', () => {
  const testDir = path.join(__dirname, 'test-fixtures');

  beforeEach(async () => {
    jest.clearAllMocks();
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(async () => {
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir);
      for (const file of files) {
        fs.unlinkSync(path.join(testDir, file));
      }
      fs.rmdirSync(testDir);
    }
  });

  it('should resize image and delete original file', async () => {
    const inputPath = path.join(testDir, 'test-avatar.jpg');
    const outputPath = path.join(testDir, 'resized-test-avatar.jpg');
    fs.writeFileSync(inputPath, Buffer.from('fake-image-data'));

    await resizeAvatar(inputPath, outputPath);

    expect(mockSharp).toHaveBeenCalledWith(inputPath);
    expect(fs.existsSync(inputPath)).toBe(false);
  });

  it('should apply custom width and height', async () => {
    const inputPath = path.join(testDir, 'custom.jpg');
    const outputPath = path.join(testDir, 'resized-custom.jpg');
    fs.writeFileSync(inputPath, Buffer.from('fake-image-data'));

    await resizeAvatar(inputPath, outputPath, { width: 300, height: 300 });

    const mockInstance = lastMockInstance;
    expect(mockInstance.resize).toHaveBeenCalledWith(300, 300, {
      fit: 'cover',
      position: 'centre',
    });
  });

  it('should use default dimensions 200x200', async () => {
    const inputPath = path.join(testDir, 'default.jpg');
    const outputPath = path.join(testDir, 'resized-default.jpg');
    fs.writeFileSync(inputPath, Buffer.from('fake-image-data'));

    await resizeAvatar(inputPath, outputPath);

    const mockInstance = lastMockInstance;
    expect(mockInstance.resize).toHaveBeenCalledWith(200, 200, {
      fit: 'cover',
      position: 'centre',
    });
  });

  it('should apply jpeg quality for jpg files', async () => {
    const inputPath = path.join(testDir, 'test.jpg');
    const outputPath = path.join(testDir, 'resized-test.jpg');
    fs.writeFileSync(inputPath, Buffer.from('fake-image-data'));

    await resizeAvatar(inputPath, outputPath, { quality: 90 });

    const mockInstance = lastMockInstance;
    expect(mockInstance.jpeg).toHaveBeenCalledWith({ quality: 90 });
  });

  it('should apply png quality for png files', async () => {
    const inputPath = path.join(testDir, 'test.png');
    const outputPath = path.join(testDir, 'resized-test.png');
    fs.writeFileSync(inputPath, Buffer.from('fake-image-data'));

    await resizeAvatar(inputPath, outputPath, { quality: 75 });

    const mockInstance = lastMockInstance;
    expect(mockInstance.png).toHaveBeenCalledWith({ quality: 75 });
  });
});
