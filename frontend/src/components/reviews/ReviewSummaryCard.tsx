type ReviewSummaryCardProps = {
  summary: string;
};

export function ReviewSummaryCard({ summary }: ReviewSummaryCardProps) {
  return (
    <div className="glass-card rounded-2xl border border-outline-variant/35 p-5 shadow-xl md:p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary/90">
        Ziyaretçi özeti
      </h3>
      <p className="mt-3 text-base leading-relaxed text-on-surface-variant">
        {summary}
      </p>
    </div>
  );
}
