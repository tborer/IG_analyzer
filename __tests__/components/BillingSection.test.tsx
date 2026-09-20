// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import BillingSection from '@/components/BillingSection';

describe('BillingSection', () => {
  it('shows the Upgrade button when Stripe is enabled', () => {
    render(
      <BillingSection
        effectivePlan="free"
        subscriptionStatus={null}
        currentPeriodEnd={null}
        hasStripeCustomer={false}
        stripeEnabled={true}
      />
    );

    expect(screen.getByRole('button', { name: 'Upgrade' })).toBeInTheDocument();
  });

  it('hides the Upgrade button and shows a placeholder when Stripe is disabled', () => {
    render(
      <BillingSection
        effectivePlan="free"
        subscriptionStatus={null}
        currentPeriodEnd={null}
        hasStripeCustomer={false}
        stripeEnabled={false}
      />
    );

    expect(screen.queryByRole('button', { name: 'Upgrade' })).not.toBeInTheDocument();
    expect(screen.getByText(/payments aren't available yet/i)).toBeInTheDocument();
  });

  it('still shows Manage billing for an existing customer even when Stripe checkout is disabled', () => {
    render(
      <BillingSection
        effectivePlan="paid"
        subscriptionStatus="active"
        currentPeriodEnd={null}
        hasStripeCustomer={true}
        stripeEnabled={false}
      />
    );

    expect(screen.getByRole('button', { name: 'Manage billing' })).toBeInTheDocument();
  });
});
