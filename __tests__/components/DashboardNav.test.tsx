// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const push = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
});

describe('DashboardNav', () => {
  it('renders links to every dashboard section', async () => {
    const { default: DashboardNav } = await import('@/components/DashboardNav');
    render(<DashboardNav />);

    expect(screen.getByRole('link', { name: 'New audit' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute(
      'href',
      '/dashboard/history'
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/dashboard/settings'
    );
  });

  it('logs out and redirects home on click (edge case: async fetch before navigation)', async () => {
    const user = userEvent.setup();
    const { default: DashboardNav } = await import('@/components/DashboardNav');
    render(<DashboardNav />);

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    expect(push).toHaveBeenCalledWith('/');
    expect(refresh).toHaveBeenCalled();
  });
});
