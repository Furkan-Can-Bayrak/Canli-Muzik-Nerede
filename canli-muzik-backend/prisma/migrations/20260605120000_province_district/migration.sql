-- Rename City -> Province and add plateCode
ALTER TABLE "City" RENAME TO "Province";
ALTER TABLE "Province" ADD COLUMN "plateCode" TEXT;

-- Backfill plateCode from existing names (seed will set proper values)
UPDATE "Province" SET "plateCode" = '34' WHERE "name" = 'İstanbul';
UPDATE "Province" SET "plateCode" = '06' WHERE "name" = 'Ankara';
UPDATE "Province" SET "plateCode" = '35' WHERE "name" = 'İzmir';
UPDATE "Province" SET "plateCode" = '16' WHERE "name" = 'Bursa';
UPDATE "Province" SET "plateCode" = '07' WHERE "name" = 'Antalya';
UPDATE "Province" SET "plateCode" = '01' WHERE "name" = 'Adana';
UPDATE "Province" SET "plateCode" = '27' WHERE "name" = 'Gaziantep';
UPDATE "Province" SET "plateCode" = '42' WHERE "name" = 'Konya';
UPDATE "Province" SET "plateCode" = LPAD("id", 2, '0') WHERE "plateCode" IS NULL;

ALTER TABLE "Province" ALTER COLUMN "plateCode" SET NOT NULL;
CREATE UNIQUE INDEX "Province_plateCode_key" ON "Province"("plateCode");

-- District table
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "District_provinceId_name_key" ON "District"("provinceId", "name");
CREATE INDEX "District_provinceId_idx" ON "District"("provinceId");

ALTER TABLE "District" ADD CONSTRAINT "District_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BandCity -> BandProvince
ALTER TABLE "BandCity" RENAME TO "BandProvince";
ALTER TABLE "BandProvince" RENAME COLUMN "cityId" TO "provinceId";

ALTER TABLE "BandProvince" DROP CONSTRAINT IF EXISTS "BandCity_cityId_fkey";
ALTER TABLE "BandProvince" DROP CONSTRAINT IF EXISTS "BandCity_bandId_fkey";
ALTER TABLE "BandProvince" DROP CONSTRAINT IF EXISTS "BandCity_pkey";

ALTER TABLE "BandProvince" ADD CONSTRAINT "BandProvince_pkey" PRIMARY KEY ("bandId", "provinceId");
ALTER TABLE "BandProvince" ADD CONSTRAINT "BandProvince_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "BandProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BandProvince" ADD CONSTRAINT "BandProvince_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "BandCity_cityId_idx";
CREATE INDEX "BandProvince_provinceId_idx" ON "BandProvince"("provinceId");

-- CafeProfile
ALTER TABLE "CafeProfile" RENAME COLUMN "cityId" TO "provinceId";
ALTER TABLE "CafeProfile" ADD COLUMN "districtId" TEXT;
ALTER TABLE "CafeProfile" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "CafeProfile" ADD COLUMN "longitude" DOUBLE PRECISION;

ALTER TABLE "CafeProfile" DROP CONSTRAINT IF EXISTS "CafeProfile_cityId_fkey";
ALTER TABLE "CafeProfile" ADD CONSTRAINT "CafeProfile_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CafeProfile" ADD CONSTRAINT "CafeProfile_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Event
ALTER TABLE "Event" RENAME COLUMN "cityId" TO "provinceId";
ALTER TABLE "Event" ADD COLUMN "districtId" TEXT;

ALTER TABLE "Event" DROP CONSTRAINT IF EXISTS "Event_cityId_fkey";
ALTER TABLE "Event" ADD CONSTRAINT "Event_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "Event_cityId_idx";
CREATE INDEX "Event_provinceId_idx" ON "Event"("provinceId");
CREATE INDEX "Event_districtId_idx" ON "Event"("districtId");
