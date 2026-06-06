import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const GENRES = [
  'Rock',
  'Caz',
  'Akustik',
  'Elektronik',
  'Türk Halk Müziği',
  'Blues',
  'Soul',
  'Alternatif',
];

type RawProvince = {
  plateCode: number;
  name: string;
  discrits: string[];
};

type RawData = {
  city: RawProvince[];
};

function toTitleCaseTr(value: string): string {
  const lower = value.trim().toLocaleLowerCase('tr-TR');
  if (!lower) return lower;
  return lower.replace(/(^|\s)(\S)/g, (_, sep: string, ch: string) =>
    sep + ch.toLocaleUpperCase('tr-TR'),
  );
}

function loadProvinceDistrictData(): RawData {
  const path = join(__dirname, 'data', 'tr-provinces-districts.json');
  return JSON.parse(readFileSync(path, 'utf8')) as RawData;
}

async function seedProvincesAndDistricts() {
  const data = loadProvinceDistrictData();
  let districtCount = 0;

  for (const row of data.city) {
    const plateCode = String(row.plateCode).padStart(2, '0');
    const name = toTitleCaseTr(row.name);

    const province = await prisma.province.upsert({
      where: { plateCode },
      create: { plateCode, name },
      update: { name },
    });

    for (const rawDistrict of row.discrits) {
      const districtName = toTitleCaseTr(rawDistrict);
      await prisma.district.upsert({
        where: {
          provinceId_name: {
            provinceId: province.id,
            name: districtName,
          },
        },
        create: {
          id: randomUUID(),
          provinceId: province.id,
          name: districtName,
        },
        update: {},
      });
      districtCount += 1;
    }
  }

  return { provinceCount: data.city.length, districtCount };
}

async function main() {
  const { provinceCount, districtCount } = await seedProvincesAndDistricts();

  for (const name of GENRES) {
    await prisma.genre.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  console.log(
    `Seeded ${provinceCount} provinces, ${districtCount} districts, and ${GENRES.length} genres.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
