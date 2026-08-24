import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import DashboardNav from '@/components/DashboardNav';

type AuditRow = { id: string; created_at: string; result: string };

function formatCreatedAt(sqliteTimestamp: string) {
  // libSQL's datetime('now') format is "YYYY-MM-DD HH:MM:SS" in UTC, no
  // timezone marker -- normalize it to an ISO string JS can parse correctly.
  const iso = sqliteTimestamp.includes('T')
    ? sqliteTimestamp
    : `${sqliteTimestamp.replace(' ', 'T')}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? sqliteTimestamp : date.toLocaleString();
}

export default async function HistoryPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const rows = await query<AuditRow>(
    'select id, created_at, result from audits where user_id = ? order by created_at desc limit 50',
    [userId]
  );

  const audits = rows.map((row) => {
    let headline = 'Audit';
    let overallScore: number | null = null;
    try {
      const parsed = JSON.parse(row.result);
      if (typeof parsed.headline === 'string') headline = parsed.headline;
      if (typeof parsed.overallScore === 'number') overallScore = parsed.overallScore;
    } catch {
      // Legacy or malformed row -- fall back to the defaults above.
    }
    return { id: row.id, createdAt: row.created_at, headline, overallScore };
  });

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
      <DashboardNav />
      <p className="eyebrow text-brass mb-3">History</p>
      <h1 className="font-display text-3xl mb-10">Past audits</h1>

      {audits.length === 0 ? (
        <p className="text-sm text-mist">
          No audits yet.{' '}
          <Link href="/dashboard" className="text-brass hover:underline">
            Run your first one
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-3">
          {audits.map((a) => (
            <li
              key={a.id}
              className="border border-hair rounded-lg bg-inkraised p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm text-bone/90">{a.headline}</p>
                <p className="text-xs text-mist mt-1">{formatCreatedAt(a.createdAt)}</p>
              </div>
              {a.overallScore !== null && (
                <span className="font-mono text-brass text-lg shrink-0">
                  {Math.round(a.overallScore)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
