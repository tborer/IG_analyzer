import ScoreDial from './ScoreDial';
import VerdictBadge from './VerdictBadge';

export type PhotoAudit = {
  index: number;
  score: number;
  archetype: string;
  strengths: string[];
  issues: string[];
  datingSignal: string;
  verdict: 'feature' | 'keep' | 'refresh' | 'retire';
};

export default function PhotoAuditCard({
  audit,
  previewUrl,
  rank,
}: {
  audit: PhotoAudit;
  previewUrl: string;
  rank?: number;
}) {
  return (
    <div className="border border-hair rounded-lg bg-inkraised overflow-hidden flex flex-col">
      <div className="relative aspect-[4/5] bg-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt={`Photo ${audit.index + 1}`} className="w-full h-full object-cover" />
        {rank !== undefined && (
          <div className="absolute top-2 left-2 font-mono text-xs bg-ink/80 border border-hair rounded px-1.5 py-0.5 text-bone">
            #{rank}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 items-start">
            <VerdictBadge verdict={audit.verdict} />
            <span className="eyebrow text-mist">{audit.archetype}</span>
          </div>
          <ScoreDial score={audit.score} size={56} />
        </div>
        <p className="text-sm text-bone/85 italic">{audit.datingSignal}</p>
        {audit.strengths.length > 0 && (
          <div>
            <p className="eyebrow text-moss mb-1">Working</p>
            <ul className="text-sm text-bone/85 space-y-1">
              {audit.strengths.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-moss">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {audit.issues.length > 0 && (
          <div>
            <p className="eyebrow text-signal mb-1">Fix</p>
            <ul className="text-sm text-bone/85 space-y-1">
              {audit.issues.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-signal">−</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
