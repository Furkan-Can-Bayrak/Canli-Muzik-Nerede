"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { FeaturedBands } from "@/components/home/FeaturedBands";
import { HomeHero } from "@/components/home/HomeHero";
import { NewsletterCta } from "@/components/home/NewsletterCta";
import {
  buildEventsPageUrl,
  useEventsExplore,
} from "@/hooks/use-events-explore";
import { useAuth } from "@/contexts/auth-context";

export function HomePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, ready } = useAuth();
  const explore = useEventsExplore(
    token,
    ready,
    searchParams.get("cafeId") ?? "",
  );

  const goToEvents = useCallback(() => {
    router.push(
      buildEventsPageUrl({
        q: explore.q,
        provinceId: explore.provinceId,
        districtId: explore.districtId,
        dateFrom: explore.dateFrom,
        dateTo: explore.dateTo,
      }),
    );
  }, [
    router,
    explore.q,
    explore.provinceId,
    explore.districtId,
    explore.dateFrom,
    explore.dateTo,
  ]);

  return (
    <>
      <HomeHero explore={explore} onSearch={goToEvents} />
      <FeaturedBands />
      <NewsletterCta />
    </>
  );
}
