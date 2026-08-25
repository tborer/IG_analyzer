import ScoreDial from './ScoreDial';
import PhotoAuditCard, { PhotoAudit } from './PhotoAuditCard';
import CoverageChecklist from './CoverageChecklist';

export type AuditResult = {
  overallScore: number;
  headline: string;
  profileCoverage: { aspect: string; covered: boolean; note: string }[];
  avatar: { score: number; identifiable: boolean; issues: string[]; note: string } | null;
  displayName: { value: string; usesRealName: boolean; note: string } | null;
  profileHeader: { score: number; notes: string[] } | null;
  gridCohesion: { score: number; notes: string[] } | null;
  photos: PhotoAudit[];
  recommendedOrder: number[];
  photoArchetypeCoverage: { archetype: string; covered: boolean; recommendation: string }[];
  bio: {
    score: number;
    feedback: string;
    closestArchetype: string;
    rewriteSuggestion: string;
    redFlags: { flag: string; present: boolean; note: string }[];
    link: { present: boolean; value: string | null; signalsStatus: boolean; note: string };
  } | null;
  contentStrategy: string[];
  topActions: string[];
};

function ScoredNotesCard({
  title,
  data,
}: {
  title: string;
  data: { score: number; notes: string[] };
}) {
  return (
    <div className="border border-hair rounded-lg bg-inkraised p-6">
      <div className="flex items-center gap-4 mb-4">
        <ScoreDial score={data.score} size={56} />
        <h2 className="font-display text-lg text-bone">{title}</h2>
      </div>
      <ul className="text-sm text-bone/85 space-y-2">
        {data.notes.map((note, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-brass">·</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AuditResults({
  result,
  previewUrls,
}: {
  result: AuditResult;
  previewUrls: string[];
}) {
  const byIndex = new Map(result.photos.map((p) => [p.index, p]));
  const scoredPhotos = new Set(result.photos.map((p) => p.index));
  const unscoredCount = previewUrls.length - scoredPhotos.size;

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border border-hair rounded-lg bg-inkraised p-6">
        <ScoreDial score={result.overallScore} label="Overall" size={112} />
        <div>
          <p className="eyebrow text-brass mb-2">Verdict</p>
          <p className="font-display text-xl sm:text-2xl leading-snug text-bone">{result.headline}</p>
        </div>
      </div>

      <CoverageChecklist
        title="What this audit could see"
        hint="Add what's missing for a fuller picture"
        items={result.profileCoverage.map((c) => ({
          label: c.aspect,
          covered: c.covered,
          note: c.note,
        }))}
      />

      {result.avatar && (
        <div className="border border-hair rounded-lg bg-inkraised p-6">
          <div className="flex items-center gap-4 mb-4">
            <ScoreDial score={result.avatar.score} size={56} />
            <div>
              <h2 className="font-display text-lg text-bone">Profile picture</h2>
              <span
                className={`eyebrow ${result.avatar.identifiable ? 'text-moss' : 'text-signal'}`}
              >
                {result.avatar.identifiable ? 'Clearly identifiable' : 'Not clearly identifiable'}
              </span>
            </div>
          </div>
          <p className="text-sm text-bone/85 mb-3">{result.avatar.note}</p>
          {result.avatar.issues.length > 0 && (
            <ul className="text-sm text-bone/85 space-y-1">
              {result.avatar.issues.map((issue, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-signal">−</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {result.profileHeader && <ScoredNotesCard title="Profile bio & header" data={result.profileHeader} />}

      {result.displayName && (
        <div className="border border-hair rounded-lg bg-inkraised p-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-lg text-bone">Display name</h2>
            <span
              className={`eyebrow ${result.displayName.usesRealName ? 'text-moss' : 'text-signal'}`}
            >
              "{result.displayName.value}"
            </span>
          </div>
          <p className="text-sm text-bone/85">{result.displayName.note}</p>
        </div>
      )}

      {result.gridCohesion && <ScoredNotesCard title="Grid cohesion" data={result.gridCohesion} />}

      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-lg text-bone">Photos to feature</h2>
          <span className="eyebrow text-mist">Best first</span>
        </div>
        {unscoredCount > 0 && (
          <p className="text-sm text-signal mb-4">
            {unscoredCount} photo{unscoredCount > 1 ? 's' : ''} couldn't be scored — try re-running the audit.
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {result.recommendedOrder.map((idx, rank) => {
            const audit = byIndex.get(idx);
            const url = previewUrls[idx];
            if (!audit || !url) return null;
            return <PhotoAuditCard key={idx} audit={audit} previewUrl={url} rank={rank + 1} />;
          })}
        </div>
      </div>

      <CoverageChecklist
        title="Photo archetypes"
        hint="Proven dating-profile shot types"
        items={result.photoArchetypeCoverage.map((a) => ({
          label: a.archetype,
          covered: a.covered,
          note: a.recommendation,
        }))}
      />

      {result.bio && (
        <div className="border border-hair rounded-lg bg-inkraised p-6">
          <div className="flex items-center gap-4 mb-4">
            <ScoreDial score={result.bio.score} size={56} />
            <div>
              <h2 className="font-display text-lg text-bone">Bio</h2>
              <span className="eyebrow text-mist">{result.bio.closestArchetype}</span>
            </div>
          </div>
          <p className="text-sm text-bone/85 mb-4">{result.bio.feedback}</p>
          <p className="eyebrow text-brass mb-2">Try this instead</p>
          <p className="text-sm text-bone/90 font-body italic border-l-2 border-brass/50 pl-4 mb-4">
            {result.bio.rewriteSuggestion}
          </p>
          <p className="eyebrow text-brass mb-2">Link</p>
          <p className="text-sm text-bone/85">{result.bio.link.note}</p>
        </div>
      )}

      {result.bio && result.bio.redFlags.length > 0 && (
        <CoverageChecklist
          title="Bio status-killers"
          hint="Clean = not present"
          items={result.bio.redFlags.map((r) => ({
            label: r.flag,
            covered: !r.present,
            note: r.note,
          }))}
        />
      )}

      {result.contentStrategy.length > 0 && (
        <div className="border border-hair rounded-lg bg-inkraised p-6">
          <h2 className="font-display text-lg text-bone mb-4">Content strategy</h2>
          <ul className="text-sm text-bone/85 space-y-2">
            {result.contentStrategy.map((note, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brass">·</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
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
