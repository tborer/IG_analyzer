const STYLES: Record<string, string> = {
  feature: 'bg-brass/15 text-brass border-brass/40',
  keep: 'bg-moss/15 text-moss border-moss/40',
  refresh: 'bg-signal/15 text-signal border-signal/40',
  retire: 'bg-signal/15 text-signal border-signal/40',
};

const LABELS: Record<string, string> = {
  feature: 'Feature',
  keep: 'Keep',
  refresh: 'Refresh',
  retire: 'Retire',
};

export default function VerdictBadge({ verdict }: { verdict: string }) {
  const cls = STYLES[verdict] ?? STYLES.keep;
  return (
    <span className={`eyebrow inline-block px-2 py-1 rounded-full border ${cls}`}>
      {LABELS[verdict] ?? verdict}
    </span>
  );
}
