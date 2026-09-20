// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaitlistModal from '@/components/WaitlistModal';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('WaitlistModal', () => {
  it('opens the modal and submits the entered email', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<WaitlistModal />);

    await user.click(screen.getByRole('button', { name: 'Join waitlist' }));
    await user.type(screen.getByLabelText('Email'), 'person@example.com');
    await user.click(screen.getByRole('button', { name: 'Notify me' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/waitlist',
        expect.objectContaining({ body: JSON.stringify({ email: 'person@example.com' }) })
      )
    );
    expect(await screen.findByText(/you're on the list/i)).toBeInTheDocument();
  });

  it('shows the server-side error on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'The waitlist is not open right now.' }) })
    );
    const user = userEvent.setup();
    render(<WaitlistModal />);

    await user.click(screen.getByRole('button', { name: 'Join waitlist' }));
    await user.type(screen.getByLabelText('Email'), 'person@example.com');
    await user.click(screen.getByRole('button', { name: 'Notify me' }));

    expect(await screen.findByText('The waitlist is not open right now.')).toBeInTheDocument();
  });
});
