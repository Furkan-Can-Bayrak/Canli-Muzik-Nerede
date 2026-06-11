import { readdir, unlink } from 'fs/promises';
import { join, extname } from 'path';
import sharp from 'sharp';

const genresDir = join(process.cwd(), 'static', 'genres');

const SLUG_BY_KEY = {
  rock: 'rock',
  caz: 'caz',
  akustik: 'akustik',
  elektronik: 'elektronik',
  blues: 'blues',
  soul: 'soul',
  alternatif: 'alternatif',
  'turk-halk-muzigi': 'turk-halk-muzigi',
  'turk-sanat-muzigi': 'turk-sanat-muzigi',
};

function toSlug(baseName) {
  const lower = baseName.trim().toLocaleLowerCase('tr-TR');
  if (lower.includes('halk')) return 'turk-halk-muzigi';
  if (lower.includes('sanat')) return 'turk-sanat-muzigi';
  const key = lower
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return SLUG_BY_KEY[key] ?? key;
}

const entries = await readdir(genresDir, { withFileTypes: true });
const sources = entries.filter(
  (e) =>
    e.isFile() &&
    ['.png', '.jpg', '.jpeg'].includes(extname(e.name).toLowerCase()),
);

if (sources.length === 0) {
  console.log('No PNG/JPEG files to convert.');
  process.exit(0);
}

for (const entry of sources) {
  const inputPath = join(genresDir, entry.name);
  const slug = toSlug(entry.name.replace(/\.[^.]+$/, ''));
  const outputPath = join(genresDir, `${slug}.webp`);
  await sharp(inputPath).webp({ quality: 82 }).toFile(outputPath);
  console.log(`${entry.name} -> ${slug}.webp`);
  await unlink(inputPath);
}

const hasDefault = entries.some((e) => e.name === 'default.webp');
if (!hasDefault) {
  const fallback = join(genresDir, 'rock.webp');
  const defaultOut = join(genresDir, 'default.webp');
  await sharp(fallback).webp({ quality: 82 }).toFile(defaultOut);
  console.log('rock.webp -> default.webp (fallback copy)');
}

console.log('Done.');
