// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import CoverageChecklist from '@/components/CoverageChecklist';

describe('CoverageChecklist', () => {
  it('renders the title, hint, and every item', () => {
    render(
      <CoverageChecklist
        title="What this audit could see"
        hint="Add what's missing"
        items={[
          { label: 'Bio', covered: true, note: 'Looked good' },
          { label: 'Grid', covered: false, note: 'Not provided' },
        ]}
      />
    );

    expect(screen.getByText('What this audit could see')).toBeInTheDocument();
    expect(screen.getByText("Add what's missing")).toBeInTheDocument();
    expect(screen.getByText('Bio')).toBeInTheDocument();
    expect(screen.getByText('Grid')).toBeInTheDocument();
  });

  it('marks covered items with a check and uncovered with an X (edge case)', () => {
    render(
      <CoverageChecklist
        title="Coverage"
        items={[
          { label: 'Covered item', covered: true, note: '' },
          { label: 'Missing item', covered: false, note: '' },
        ]}
      />
    );

    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('renders with no items and no hint without crashing (edge case)', () => {
    render(<CoverageChecklist title="Empty" items={[]} />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });
});
