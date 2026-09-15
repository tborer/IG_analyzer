// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChangePasswordForm from '@/components/ChangePasswordForm';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('ChangePasswordForm', () => {
  it('does not call the network when a required field is empty (client-side validation)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces the server-side error for a too-short new password (edge case)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'New password must be at least 8 characters.' }),
      })
    );
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText('Current password'), 'currentpass');
    await user.type(screen.getByLabelText('New password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByText('New password must be at least 8 characters.')).toBeInTheDocument();
  });

  it('renders the server-side error on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Current password is incorrect.' }),
      })
    );
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText('Current password'), 'wrongpassword');
    await user.type(screen.getByLabelText('New password'), 'newlongpassword');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByText('Current password is incorrect.')).toBeInTheDocument();
  });

  it('shows a success message and clears the fields on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }));
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    const current = screen.getByLabelText('Current password') as HTMLInputElement;
    const next = screen.getByLabelText('New password') as HTMLInputElement;
    await user.type(current, 'currentpassword');
    await user.type(next, 'newlongpassword');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => expect(screen.getByText('Password updated.')).toBeInTheDocument());
    expect(current.value).toBe('');
    expect(next.value).toBe('');
  });
});
