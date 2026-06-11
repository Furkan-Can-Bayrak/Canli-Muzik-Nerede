import { Suspense } from "react";
import { HomePageClient } from "@/components/home/HomePageClient";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-container-max px-margin-mobile py-24 text-center text-sm text-on-surface-variant md:px-margin-desktop">
          Yükleniyor…
        </div>
      }
    >
      <HomePageClient />
    </Suspense>
  );
}
