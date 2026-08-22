import ScoreDial from './ScoreDial';
import PhotoAuditCard, { PhotoAudit } from './PhotoAuditCard';

export type AuditResult = {
  overallScore: number;
  headline: string;
  photos: PhotoAudit[];
  recommendedOrder: number[];
  bio: { score: number; feedback: string; rewriteSuggestion: string } | null;
  topActions: string[];
};

export default function AuditResults({
  result,
  previewUrls,
}: {
  result: AuditResult;
  previewUrls: string[];
}) {
  const byIndex = new Map(result.photos.map((p) => [p.index, p]));

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border border-hair rounded-lg bg-inkraised p-6">
        <ScoreDial score={result.overallScore} label="Overall" size={112} />
        <div>
          <p className="eyebrow text-brass mb-2">Verdict</p>
          <p className="font-display text-xl sm:text-2xl leading-snug text-bone">{result.headline}</p>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-lg text-bone">Recommended order</h2>
          <span className="eyebrow text-mist">Best lead photo first</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {result.recommendedOrder.map((idx, rank) => {
            const audit = byIndex.get(idx);
            const url = previewUrls[idx];
            if (!audit || !url) return null;
            return <PhotoAuditCard key={idx} audit={audit} previewUrl={url} rank={rank + 1} />;
          })}
        </div>
      </div>

      {result.bio && (
        <div className="border border-hair rounded-lg bg-inkraised p-6">
          <div className="flex items-center gap-4 mb-4">
            <ScoreDial score={result.bio.score} size={56} />
            <h2 className="font-display text-lg text-bone">Bio</h2>
          </div>
          <p className="text-sm text-bone/85 mb-4">{result.bio.feedback}</p>
          <p className="eyebrow text-brass mb-2">Try this instead</p>
          <p className="text-sm text-bone/90 font-body italic border-l-2 border-brass/50 pl-4">
            {result.bio.rewriteSuggestion}
          </p>
        </div>
      )}

      <div className="border border-hair rounded-lg bg-inkraised p-6">
        <h2 className="font-display text-lg text-bone mb-4">Top actions</h2>
        <ol className="space-y-3">
          {result.topActions.map((action, i) => (
            <li key={i} className="flex gap-3 text-sm text-bone/90">
              <span className="font-mono text-brass shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <span>{action}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
