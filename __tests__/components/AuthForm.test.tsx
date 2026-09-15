// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const push = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('AuthForm', () => {
  it('does not call the network when required fields are empty (client-side validation)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { default: AuthForm } = await import('@/components/AuthForm');
    render(<AuthForm mode="login" />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders the server-side error message on a failed submission', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Incorrect email or password.' }),
      })
    );
    const user = userEvent.setup();
    const { default: AuthForm } = await import('@/components/AuthForm');
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('navigates to /dashboard on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }));
    const user = userEvent.setup();
    const { default: AuthForm } = await import('@/components/AuthForm');
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'longenoughpassword');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
    expect(refresh).toHaveBeenCalled();
  });
});
