import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Learn about our terms of service and acceptable use policies.',
};

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
        <p className="mb-4">
          By using our service, you agree to use it for lawful purposes only. 
          You may not use our service to engage in any activity that violates 
          applicable laws or regulations.
        </p>
        <p className="mb-4">
          You agree not to use our service to:
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>Post any content that is illegal, threatening, or harassing</li>
          <li>Engage in spamming or other abusive behavior</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Use our service for any purpose other than its intended use</li>
        </ul>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Liability Disclaimer</h2>
        <p className="mb-4">
          Our service is provided "as is" without any warranties of any kind. 
          We do not guarantee any specific results from using our service. 
          We are not liable for any damages resulting from the use of our service.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Account Termination</h2>
        <p className="mb-4">
          We reserve the right to terminate your account at any time for any reason. 
          If we terminate your account, we will delete your data as soon as reasonably 
          possible, except for data we are required to retain by law.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Payment Terms</h2>
        <p className="mb-4">
          If you subscribe to our premium service, you agree to our payment terms.
          We will charge your payment method on file for the subscription fee, billed monthly.
          You may cancel your subscription at any time; cancellation takes effect at the end of
          your current billing period, and you'll retain access until then.
        </p>
        <p className="mb-4">
          Subscription fees are non-refundable for partial billing periods. If you believe you
          were charged in error, contact us within 7 days of the charge and we'll review it.
        </p>
        <p className="mb-4">
          If you have any questions about our payment terms, please contact us.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
        <p className="mb-4">
          We reserve the right to change these terms at any time. 
          If we make changes, we will update this page and notify you by email.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
        <p className="mb-4">
          If you have any questions about these terms, please contact us.
        </p>
      </section>
    </div>
  );
}
