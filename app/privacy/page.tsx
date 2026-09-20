import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} collects, uses, and protects your information.`,
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <Link href="/" className="font-display text-lg tracking-tight mb-16 inline-block">
        {SITE_NAME}
      </Link>
      <p className="eyebrow text-brass mb-4">Legal</p>
      <h1 className="font-display text-3xl mb-4">Privacy Policy</h1>
      <p className="text-sm text-mist mb-12">Last updated: September 2026</p>

      <div className="space-y-10">
        <section>
          <h2 className="font-display text-xl mb-3">What we collect</h2>
          <p className="text-sm text-bone/70 leading-relaxed mb-4">
            We collect your email address and a hashed (not plaintext) password when you create
            an account. We do not collect your name, phone number, or any other personal
            information at signup.
          </p>
          <p className="text-sm text-bone/70 leading-relaxed">
            When you upload bio text and profile screenshots, that content is sent to
            Anthropic&apos;s API for analysis.{' '}
            <strong className="text-bone/90 font-medium">
              Screenshots are never stored — they are analyzed and then discarded.
            </strong>{' '}
            Only the generated audit result (scores, written feedback, and the bio text you
            uploaded) is saved to your account so you can review it later.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">How we use it</h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            Your email is used for account access, transactional messages (password resets,
            account notices), and — only if you&apos;ve opted in — product updates. Uploaded
            content is used solely to generate your audit; we do not use it to train models or
            share it for any other purpose.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Who we share it with</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-bone/70 leading-relaxed">
            <li>
              <strong className="text-bone/90 font-medium">Anthropic</strong> — processes
              uploaded bio text and screenshots to generate your audit (see their own privacy
              policy for how they handle API data).
            </li>
            <li>
              <strong className="text-bone/90 font-medium">Resend</strong> — sends
              transactional email (password resets, verification) on our behalf.
            </li>
            <li>
              <strong className="text-bone/90 font-medium">Stripe</strong> — once paid billing
              is live, Stripe processes payment information as our payment sub-processor; we
              never see or store your full card number.
            </li>
          </ul>
          <p className="text-sm text-bone/70 leading-relaxed mt-4">
            We do not sell your data, and we do not share it with data brokers or advertisers.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Cookies</h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            We use a single strictly-necessary session cookie to keep you logged in — nothing
            else. It doesn&apos;t require consent under GDPR/ePrivacy rules because it&apos;s
            essential to the service functioning, not used for tracking or advertising. If we
            ever add analytics or advertising cookies, this section will be updated and a
            consent mechanism added first.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Data retention</h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            We retain your account data until you ask us to delete it. There is currently no
            self-serve account deletion — email us and we&apos;ll remove your account and
            associated audit history.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Your rights (GDPR / CCPA)</h2>
          <p className="text-sm text-bone/70 leading-relaxed mb-4">
            Regardless of where you live, you can ask us to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-bone/70 leading-relaxed">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and associated data</li>
            <li>Export your audit history in a portable format</li>
          </ul>
          <p className="text-sm text-bone/70 leading-relaxed mt-4">
            If you&apos;re in the EU/UK or California, these map to your rights under GDPR and
            CCPA/CPRA respectively — we honor the same requests for everyone rather than
            geofencing the rights that apply.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Contact</h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            Questions about this policy, or a data request? Reply to any transactional email
            you&apos;ve received from us (password reset, verification). We don&apos;t yet have
            a dedicated support address published — one will be added here once our custom
            domain is set up.
          </p>
        </section>
      </div>
    </main>
  );
}
