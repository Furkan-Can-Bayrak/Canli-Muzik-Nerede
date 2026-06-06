"use client";

import { EventsExplorer } from "@/components/EventsExplorer";
import { FeaturedBands } from "@/components/home/FeaturedBands";
import { HomeHero } from "@/components/home/HomeHero";
import { NewsletterCta } from "@/components/home/NewsletterCta";
import { useEventsExplore } from "@/hooks/use-events-explore";
import { useAuth } from "@/contexts/auth-context";

export function HomePageClient() {
  const { token, ready } = useAuth();
  const explore = useEventsExplore(token, ready);

  return (
    <>
      <HomeHero explore={explore} />
      <FeaturedBands />
      <EventsExplorer explore={explore} />
      <NewsletterCta />
    </>
  );
}
