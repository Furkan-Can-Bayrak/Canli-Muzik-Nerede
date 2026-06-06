CREATE TABLE "BandDistrict" (
    "bandId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,

    CONSTRAINT "BandDistrict_pkey" PRIMARY KEY ("bandId","districtId")
);

CREATE INDEX "BandDistrict_districtId_idx" ON "BandDistrict"("districtId");

ALTER TABLE "BandDistrict" ADD CONSTRAINT "BandDistrict_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "BandProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BandDistrict" ADD CONSTRAINT "BandDistrict_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;
