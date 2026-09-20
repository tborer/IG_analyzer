import { Shield, FileText } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
      <article className="prose prose-invert max-w-none">
        <header className="mb-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-4">Privacy Policy</h1>
          <p className="text-bone/60">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </header>

        <section className="mb-8">
          <h2 className="font-display text-xl mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brass" />
            What We Collect
          </h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            Caliber collects only the minimum necessary data to provide our services:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-3 text-sm text-bone/70">
            <li><strong>Email address:</strong> Required for account creation and audit delivery</li>
            <li><strong>Password:</strong> Used to secure your account (hashed and never stored in plaintext)</li>
            <li><strong>Screenshot uploads:</strong> Your Instagram profile screenshots are processed to generate audits, then automatically deleted from our systems</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-xl mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brass" />
            How We Use Your Data
          </h2>
          <p className="text-sm text-bone/70 leading-relaxed mb-3">
            Your information is used to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-bone/70">
            <li>Generate and deliver your Instagram profile audit</li>
            <li>Track feature usage (anonymously) to improve our service</li>
            <li>Send important account notifications (email verification, subscription updates)</li>
            <li>Process payments securely through Stripe</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-xl mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brass" />
            Data Storage & Security
          </h2>
          <p className="text-sm text-bone/70 leading-relaxed mb-3">
            We prioritize your privacy:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-bone/70">
            <li><strong>Screenshot Processing:</strong> Your Instagram screenshots are uploaded to our secure servers, analyzed by AI to generate audit results, then permanently deleted after processing. We never store your photos.</li>
            <li><strong>Email Retention:</strong> Your email is retained while your account is active and for a reasonable period afterward for legal compliance (typically 90 days after account deletion).</li>
            <li><strong>Encryption:</strong> All data in transit uses TLS encryption. Passwords are hashed using bcrypt.</li>
            <li><strong>No Third-Party Sharing:</strong> We do not sell or share your personal data with third parties except as required by law.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-xl mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brass" />
            Your Rights (GDPR / CCPA)
          </h2>
          <p className="text-sm text-bone/70 leading-relaxed mb-3">
            Depending on your location, you may have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-bone/70">
            <li>Access all personal data we hold about you</li>
            <li>Request deletion of your account and all associated data</li>
            <li>Opt-out of certain marketing communications (we only send essential notifications)</li>
            <li>Export your data in a portable format</li>
          </ul>
          <p className="text-sm text-bone/70 leading-relaxed mt-3">
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@caliger.com" className="text-brass underline decoration-dotted">
              privacy@caliger.com
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-xl mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brass" />
            Cookies & Tracking
          </h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            We use Plausible analytics to understand site traffic. Plausible is a lightweight, privacy-focused alternative to Google Analytics that does not track personal data or store cookies longer than necessary. No user tracking is performed on our behalf.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-xl mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brass" />
            Changes to This Policy
          </h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            We may update this Privacy Policy occasionally. The version on our website at any time applies to you. Material changes will be communicated via email or in-app notifications where applicable.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-display text-xl mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brass" />
            Contact Us
          </h2>
          <p className="text-sm text-bone/70 leading-relaxed">
            If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:
          </p>
          <div className="mt-3 space-y-1 text-sm text-bone/70">
            <p>Email: privacy@caliger.com</p>
            <p>Support: support@caliger.com (for general account questions)</p>
          </div>
        </section>

        <footer className="pt-8 border-t border-hair mt-12">
          <Link href="/signup" className="inline-block px-6 py-3 bg-brass text-ink font-medium rounded-lg hover:bg-brass/90 transition-colors mb-4">
            Create Account to Get Started
          </Link>
          <p className="text-xs text-mist">
            By using our services, you acknowledge that you have read and understand this Privacy Policy.
          </p>
        </footer>
      </article>
    </main>
  );
}
