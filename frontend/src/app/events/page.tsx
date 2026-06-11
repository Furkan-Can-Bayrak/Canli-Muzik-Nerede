import { Suspense } from "react";
import { EventsPageClient } from "@/components/events/EventsPageClient";

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-container-max px-margin-mobile py-24 text-center text-sm text-on-surface-variant md:px-margin-desktop">
          Yükleniyor…
        </div>
      }
    >
      <EventsPageClient />
    </Suspense>
  );
}
