// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/image-client', () => ({
  compressImages: vi.fn(async (files: File[]) => files),
}));

beforeEach(() => {
  vi.resetAllMocks();
  // jsdom's URL.createObjectURL/revokeObjectURL throw "not implemented" --
  // stub the two static methods without replacing the URL constructor itself.
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
});

function makeFile(name = 'photo.jpg', type = 'image/jpeg') {
  return new File(['fake-image-bytes'], name, { type });
}

describe('UploadForm', () => {
  it('shows a validation error when submitting with no files (client-side validation)', async () => {
    const user = userEvent.setup();
    const { default: UploadForm } = await import('@/components/UploadForm');
    render(<UploadForm />);

    await user.click(screen.getByRole('button', { name: 'Run the audit' }));

    expect(screen.getByText('Add at least one screenshot.')).toBeInTheDocument();
  });

  it('adds a preview and updates the count when a file is selected', async () => {
    const user = userEvent.setup();
    const { default: UploadForm } = await import('@/components/UploadForm');
    const { container } = render(<UploadForm />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, makeFile());

    expect(await screen.findByText('Screenshots (1/12)')).toBeInTheDocument();
  });

  it('disables the submit button while the request is in flight (edge case)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))); // never resolves
    const user = userEvent.setup();
    const { default: UploadForm } = await import('@/components/UploadForm');
    const { container } = render(<UploadForm />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, makeFile());
    await screen.findByText('Screenshots (1/12)');

    await user.click(screen.getByRole('button', { name: 'Run the audit' }));

    const submitButton = await screen.findByRole('button', { name: 'Reviewing your profile…' });
    expect(submitButton).toBeDisabled();
  });

  it('renders an upgrade link when tokens run out (§4.11)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: "You've used your free token.", upgrade: true }),
      })
    );
    const user = userEvent.setup();
    const { default: UploadForm } = await import('@/components/UploadForm');
    const { container } = render(<UploadForm />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, makeFile());
    await screen.findByText('Screenshots (1/12)');
    await user.click(screen.getByRole('button', { name: 'Run the audit' }));

    expect(await screen.findByRole('link', { name: 'Upgrade for more audits' })).toHaveAttribute(
      'href',
      '/dashboard/settings'
    );
  });

  it('renders a distinct billing link for a past_due user (§4.11 edge case)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'There was a problem with your last payment.', billingIssue: true }),
      })
    );
    const user = userEvent.setup();
    const { default: UploadForm } = await import('@/components/UploadForm');
    const { container } = render(<UploadForm />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, makeFile());
    await screen.findByText('Screenshots (1/12)');
    await user.click(screen.getByRole('button', { name: 'Run the audit' }));

    expect(await screen.findByRole('link', { name: 'Update billing' })).toBeInTheDocument();
  });
});
