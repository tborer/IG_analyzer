export type CoverageItem = {
  label: string;
  covered: boolean;
  note: string;
};

export default function CoverageChecklist({
  title,
  hint,
  items,
}: {
  title: string;
  hint?: string;
  items: CoverageItem[];
}) {
  return (
    <div className="border border-hair rounded-lg bg-inkraised p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-lg text-bone">{title}</h2>
        {hint && <span className="eyebrow text-mist">{hint}</span>}
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className={item.covered ? 'text-moss' : 'text-signal'}>
              {item.covered ? '✓' : '✕'}
            </span>
            <div>
              <p className="text-bone/90">{item.label}</p>
              <p className="text-bone/60">{item.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
