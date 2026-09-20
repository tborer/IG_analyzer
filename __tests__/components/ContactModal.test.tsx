// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactModal from '@/components/ContactModal';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('ContactModal', () => {
  it('opens the modal and submits the entered email and message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<ContactModal />);

    await user.click(screen.getByRole('button', { name: 'Contact' }));
    await user.type(screen.getByLabelText('Your email'), 'person@example.com');
    await user.type(screen.getByLabelText('Message'), 'Hello there');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/contact',
        expect.objectContaining({
          body: JSON.stringify({ email: 'person@example.com', message: 'Hello there' }),
        })
      )
    );
    expect(await screen.findByText(/your message is on its way/i)).toBeInTheDocument();
  });

  it('shows the server-side error on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'Something went wrong.' }) })
    );
    const user = userEvent.setup();
    render(<ContactModal />);

    await user.click(screen.getByRole('button', { name: 'Contact' }));
    await user.type(screen.getByLabelText('Your email'), 'person@example.com');
    await user.type(screen.getByLabelText('Message'), 'Hello there');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText('Something went wrong.')).toBeInTheDocument();
  });

  it('does not show the site owner email anywhere in the modal', async () => {
    const user = userEvent.setup();
    render(<ContactModal />);

    await user.click(screen.getByRole('button', { name: 'Contact' }));

    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });
});
