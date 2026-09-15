// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PhotoAuditCard, { PhotoAudit } from '@/components/PhotoAuditCard';

const baseAudit: PhotoAudit = {
  index: 0,
  score: 82,
  archetype: 'Travel',
  strengths: ['Great lighting'],
  issues: ['Face partially obscured'],
  datingSignal: 'Adventurous, social',
  verdict: 'feature',
};

describe('PhotoAuditCard', () => {
  it('renders the archetype, verdict, dating signal, strengths, and issues', () => {
    render(<PhotoAuditCard audit={baseAudit} previewUrl="blob:preview" rank={1} />);

    expect(screen.getByText('Travel')).toBeInTheDocument();
    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.getByText('Adventurous, social')).toBeInTheDocument();
    expect(screen.getByText('Great lighting')).toBeInTheDocument();
    expect(screen.getByText('Face partially obscured')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('hides the Working/Fix sections and rank badge when absent (edge case)', () => {
    render(
      <PhotoAuditCard
        audit={{ ...baseAudit, strengths: [], issues: [] }}
        previewUrl="blob:preview"
      />
    );

    expect(screen.queryByText('Working')).not.toBeInTheDocument();
    expect(screen.queryByText('Fix')).not.toBeInTheDocument();
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
  });
});
