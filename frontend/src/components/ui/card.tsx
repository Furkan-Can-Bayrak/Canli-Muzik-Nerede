export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-sm dark:shadow-none ${className}`}
    >
      {children}
    </div>
  );
}
