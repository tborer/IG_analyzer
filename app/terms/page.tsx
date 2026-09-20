import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Acceptable use, liability, and billing terms for ${SITE_NAME}.`,
  alternates: { canonical: '/terms' },
};

export default function TermsOfService() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <Link href="/" className="font-display text-lg tracking-tight mb-16 inline-block">
        {SITE_NAME}
      </Link>
      <p className="eyebrow text-brass mb-4">Legal</p>
      <h1 className="font-display text-3xl mb-4">Terms of Service</h1>
      <p className="text-sm text-mist mb-12">Last updated: September 2026</p>

      <div className="space-y-10">
        <section>
          <h2 className="font-display text-xl mb-3">Who can use this</h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            You must be at least 18 years old to create an account. By signing up, you confirm
            you meet that requirement.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Acceptable use</h2>
          <p className="text-sm text-bone/70 leading-relaxed mb-4">
            You agree to use {SITE_NAME} for lawful purposes only, and not to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-bone/70 leading-relaxed">
            <li>Upload photos or bios of anyone other than yourself without their consent</li>
            <li>Attempt to gain unauthorized access to our systems or another user&apos;s account</li>
            <li>Use the service to harass, impersonate, or defraud anyone</li>
            <li>Scrape, reverse-engineer, or resell the audit output at scale</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">What the audit is (and isn&apos;t)</h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            {SITE_NAME} is a critique tool — feedback grounded in photography and
            dating-presentation fundamentals. It does not guarantee more matches, dates, or any
            other outcome. The service is provided &quot;as is,&quot; without warranties of any
            kind, and we are not liable for outcomes from acting (or not acting) on the
            feedback it gives you.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Your account</h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            You&apos;re responsible for keeping your password secure and for activity on your
            account. We may suspend or terminate an account that violates these terms; where
            reasonably possible we&apos;ll delete associated data on termination, except what
            we&apos;re required to retain by law.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Billing</h2>
          <p className="text-sm text-bone/70 leading-relaxed mb-4">
            The free plan requires no payment. If you subscribe to the paid plan, you authorize
            us to charge your payment method on file on a recurring monthly basis until you
            cancel.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-bone/70 leading-relaxed">
            <li>Cancel any time; you keep paid access through the end of the current billing period</li>
            <li>Fees are non-refundable for partial billing periods</li>
            <li>If you believe you were charged in error, contact us within 7 days of the charge</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Changes to these terms</h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            We may update these terms as the product changes. Material changes will be reflected
            here with an updated date; continued use after a change means you accept the update.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Contact</h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            Questions about these terms? Reply to any transactional email you&apos;ve received
            from us. See our{' '}
            <Link href="/privacy" className="text-brass hover:underline">
              Privacy Policy
            </Link>{' '}
            for how we handle your data.
          </p>
        </section>
      </div>
    </main>
  );
}
