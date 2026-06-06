"use client";

import { FormEvent, useState } from "react";

export function NewsletterCta() {
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(
      "Bülten kaydı çok yakında. Şimdilik favori etkinlikleri keşfetmeye devam edin.",
    );
  }

  return (
    <section className="mx-auto max-w-container-max px-margin-mobile py-24 text-center md:px-margin-desktop">
      <div className="glass-card relative overflow-hidden rounded-[40px] border border-outline-variant/30 px-8 py-20">
        <div className="absolute -right-32 -top-32 size-64 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 size-64 rounded-full bg-secondary/10 blur-[100px]" />
        <h2 className="mb-6 font-display text-4xl font-bold text-on-surface md:text-5xl">
          Hiçbir konseri kaçırma.
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg text-on-surface-variant">
          Yakında e-posta ile haftalık etkinlik özeti. Şimdilik takvimden canlı
          yayınları takip edebilirsin.
        </p>
        <form
          onSubmit={onSubmit}
          className="mx-auto flex max-w-lg flex-col gap-4 md:flex-row"
        >
          <input
            type="email"
            required
            placeholder="E-posta adresiniz"
            className="flex-1 rounded-full border border-outline-variant/35 bg-surface-variant px-6 py-4 font-sans text-base text-on-surface outline-none ring-primary focus:border-transparent focus:ring-2"
          />
          <button
            type="submit"
            className="rounded-full bg-primary px-10 py-4 text-base font-bold text-on-primary transition-transform hover:scale-[0.98] whitespace-nowrap"
          >
            Abone ol
          </button>
        </form>
        {msg ? (
          <p className="mx-auto mt-6 max-w-md text-sm text-secondary">{msg}</p>
        ) : null}
      </div>
    </section>
  );
}
