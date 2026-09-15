// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreDial from '@/components/ScoreDial';

describe('ScoreDial', () => {
  it('renders the rounded score', () => {
    render(<ScoreDial score={73.6} />);
    expect(screen.getByText('74')).toBeInTheDocument();
  });

  it('renders an optional label', () => {
    render(<ScoreDial score={50} label="Overall" />);
    expect(screen.getByText('Overall')).toBeInTheDocument();
  });

  it('omits the label element entirely when none is given', () => {
    const { container } = render(<ScoreDial score={50} />);
    expect(container.querySelector('span.eyebrow')).toBeNull();
  });

  it('clamps an out-of-range score without throwing (edge case)', () => {
    render(<ScoreDial score={150} />);
    expect(screen.getByText('150')).toBeInTheDocument(); // text shows the raw value
    // the ring itself is clamped -- verify the offset calculation didn't
    // produce a negative dasharray/offset that would silently mis-render.
    const circles = document.querySelectorAll('circle');
    const progress = circles[1];
    expect(Number(progress.getAttribute('stroke-dashoffset'))).toBeGreaterThanOrEqual(0);
  });
});
