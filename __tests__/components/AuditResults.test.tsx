// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuditResults, { AuditResult } from '@/components/AuditResults';

const fullResult: AuditResult = {
  overallScore: 78,
  headline: 'Strong foundation, needs a sharper opener',
  profileCoverage: [{ aspect: 'Bio', covered: true, note: 'Read clearly' }],
  avatar: { score: 60, identifiable: true, issues: ['Slightly cropped'], note: 'Clear face shot' },
  displayName: { value: 'Jordan', usesRealName: true, note: 'Real name used' },
  profileHeader: { score: 70, notes: ['Bio is concise'] },
  gridCohesion: { score: 65, notes: ['Consistent tone'] },
  photos: [
    {
      index: 0,
      score: 82,
      archetype: 'Travel',
      strengths: ['Great lighting'],
      issues: [],
      datingSignal: 'Adventurous',
      verdict: 'feature',
    },
  ],
  recommendedOrder: [0],
  photoArchetypeCoverage: [{ archetype: 'Solo close-up', covered: true, recommendation: 'Keep it' }],
  bio: {
    score: 55,
    feedback: 'Clear but generic',
    closestArchetype: 'Minimal',
    rewriteSuggestion: 'Add a specific detail about a recent trip.',
    redFlags: [{ flag: 'Height mention', present: false, note: 'None found' }],
    link: { present: false, value: null, signalsStatus: false, note: 'No link in bio' },
    emojiDensity: { emojiCount: 1, totalGraphemes: 40, ratio: 0.025, verdict: 'clean' },
  },
  contentStrategy: ['Post more candid shots'],
  topActions: ['Replace the group photo as the lead image'],
  bioStaleness: { streak: 3, note: 'Same bio for the last 3 audits' },
};

const minimalResult: AuditResult = {
  ...fullResult,
  avatar: null,
  displayName: null,
  profileHeader: null,
  gridCohesion: null,
  bio: null,
  bioStaleness: null,
  contentStrategy: [],
};

describe('AuditResults', () => {
  it('renders every section given a full result', () => {
    render(<AuditResults result={fullResult} previewUrls={['blob:0']} />);

    expect(screen.getByText('Strong foundation, needs a sharper opener')).toBeInTheDocument();
    expect(screen.getByText('Profile picture')).toBeInTheDocument();
    expect(screen.getByText('Display name')).toBeInTheDocument();
    expect(screen.getByText('Grid cohesion')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bio' })).toBeInTheDocument();
    expect(screen.getByText("Bio hasn't changed", { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Replace the group photo as the lead image')).toBeInTheDocument();
  });

  it('degrades gracefully when optional sections are null (edge case)', () => {
    render(<AuditResults result={minimalResult} previewUrls={['blob:0']} />);

    expect(screen.queryByText('Profile picture')).not.toBeInTheDocument();
    expect(screen.queryByText('Display name')).not.toBeInTheDocument();
    expect(screen.queryByText('Grid cohesion')).not.toBeInTheDocument();
    // "Bio" as a section heading shouldn't render when bio is null, but the
    // core layout (overall score, coverage, photos) still does.
    expect(screen.getByText('Strong foundation, needs a sharper opener')).toBeInTheDocument();
    expect(screen.getByText('Photos to feature')).toBeInTheDocument();
  });

  it('flags photos that could not be matched to a preview URL (edge case)', () => {
    render(<AuditResults result={fullResult} previewUrls={['blob:0', 'blob:1']} />);
    expect(screen.getByText(/couldn.t be scored/)).toBeInTheDocument();
  });
});
