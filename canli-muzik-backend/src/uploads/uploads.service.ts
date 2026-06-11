import { BadRequestException, Injectable } from '@nestjs/common';
import { MediaType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export function toPublicMediaUrl(
  path: string,
  req?: { protocol: string; get(name: string): string | undefined },
): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const configured = process.env.PUBLIC_API_URL?.replace(/\/$/, '');
  if (configured) return `${configured}${path}`;
  if (req) {
    const host = req.get('host');
    if (host) return `${req.protocol}://${host}${path}`;
  }
  const port = process.env.PORT ?? '3000';
  return `http://localhost:${port}${path}`;
}

@Injectable()
export class UploadsService {
  private readonly uploadsRoot = join(process.cwd(), 'uploads');

  async saveBandMedia(
    bandId: string,
    file: Express.Multer.File,
    type: MediaType,
  ): Promise<string> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Dosya gerekli');
    }

    const mime = file.mimetype?.toLowerCase() ?? '';
    if (type === MediaType.IMAGE) {
      if (!IMAGE_MIMES.has(mime)) {
        throw new BadRequestException(
          'Geçersiz görsel formatı (JPEG, PNG, WebP, GIF)',
        );
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw new BadRequestException('Görsel en fazla 5 MB olabilir');
      }
    } else {
      if (!VIDEO_MIMES.has(mime)) {
        throw new BadRequestException(
          'Geçersiz video formatı (MP4, WebM, MOV)',
        );
      }
      if (file.size > MAX_VIDEO_BYTES) {
        throw new BadRequestException('Video en fazla 50 MB olabilir');
      }
    }

    const ext =
      this.extensionForMime(mime) ??
      (extname(file.originalname) || '.bin');
    const filename = `${randomUUID()}${ext}`;
    const dir = join(this.uploadsRoot, 'bands', bandId);
    await mkdir(dir, { recursive: true });
    const absolute = join(dir, filename);
    await writeFile(absolute, file.buffer);
    return `/uploads/bands/${bandId}/${filename}`;
  }

  async saveEventPoster(
    cafeId: string,
    eventId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Dosya gerekli');
    }

    const mime = file.mimetype?.toLowerCase() ?? '';
    if (!IMAGE_MIMES.has(mime)) {
      throw new BadRequestException(
        'Geçersiz görsel formatı (JPEG, PNG, WebP, GIF)',
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Kapak görseli en fazla 5 MB olabilir');
    }

    const ext =
      this.extensionForMime(mime) ??
      (extname(file.originalname) || '.jpg');
    const filename = `${randomUUID()}${ext}`;
    const dir = join(this.uploadsRoot, 'events', cafeId, eventId);
    await mkdir(dir, { recursive: true });
    const absolute = join(dir, filename);
    await writeFile(absolute, file.buffer);
    return `/uploads/events/${cafeId}/${eventId}/${filename}`;
  }

  async saveCafeCover(
    cafeId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Dosya gerekli');
    }

    const mime = file.mimetype?.toLowerCase() ?? '';
    if (!IMAGE_MIMES.has(mime)) {
      throw new BadRequestException(
        'Geçersiz görsel formatı (JPEG, PNG, WebP, GIF)',
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Kapak görseli en fazla 5 MB olabilir');
    }

    const ext =
      this.extensionForMime(mime) ??
      (extname(file.originalname) || '.jpg');
    const filename = `${randomUUID()}${ext}`;
    const dir = join(this.uploadsRoot, 'cafes', cafeId);
    await mkdir(dir, { recursive: true });
    const absolute = join(dir, filename);
    await writeFile(absolute, file.buffer);
    return `/uploads/cafes/${cafeId}/${filename}`;
  }

  async deleteStoredUrl(url: string): Promise<void> {
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    if (!path.startsWith('/uploads/')) return;
    const absolute = join(this.uploadsRoot, path.replace(/^\/uploads\//, ''));
    if (!existsSync(absolute)) return;
    await unlink(absolute).catch(() => undefined);
  }

  toPublicUrl(
    path: string,
    req?: { protocol: string; get(name: string): string | undefined },
  ): string {
    return toPublicMediaUrl(path, req);
  }

  private extensionForMime(mime: string): string | null {
    switch (mime) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/gif':
        return '.gif';
      case 'video/mp4':
        return '.mp4';
      case 'video/webm':
        return '.webm';
      case 'video/quicktime':
        return '.mov';
      default:
        return null;
    }
  }
}
