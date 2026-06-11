"use client";

import { useSearchParams } from "next/navigation";
import { EventsExplorer } from "@/components/EventsExplorer";
import { useAuth } from "@/contexts/auth-context";
import {
  eventsExploreUrlFromSearchParams,
  useEventsExplore,
} from "@/hooks/use-events-explore";

export function EventsPageClient() {
  const searchParams = useSearchParams();
  const { token, ready } = useAuth();
  const urlFilters = eventsExploreUrlFromSearchParams(searchParams);
  const explore = useEventsExplore(
    token,
    ready,
    searchParams.get("cafeId") ?? "",
    urlFilters,
  );

  return (
    <div className="relative min-h-[calc(100vh-10rem)] overflow-hidden">
      <div
        className="pointer-events-none absolute -left-20 top-16 size-72 rounded-full bg-primary/10 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-10 size-72 rounded-full bg-secondary/10 blur-[100px]"
        aria-hidden
      />
      <EventsExplorer explore={explore} variant="page" />
    </div>
  );
}
