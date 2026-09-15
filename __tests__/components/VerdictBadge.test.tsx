// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import VerdictBadge from '@/components/VerdictBadge';

describe('VerdictBadge', () => {
  it.each(['feature', 'keep', 'refresh', 'retire'] as const)('renders the %s label', (verdict) => {
    render(<VerdictBadge verdict={verdict} />);
    expect(screen.getByText(verdict[0].toUpperCase() + verdict.slice(1))).toBeInTheDocument();
  });

  it('falls back to the raw string for an unknown verdict', () => {
    render(<VerdictBadge verdict="mystery" />);
    expect(screen.getByText('mystery')).toBeInTheDocument();
  });
});
