export const SummaryTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
    <p className="text-base font-semibold text-foreground">{value}</p>
  </div>
);

