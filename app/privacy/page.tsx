import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how we collect, use, and protect your information.',
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">What We Collect</h2>
        <p className="mb-4">
          We collect your email address and password hash when you create an account. 
          We do not store any other personal information.
        </p>
        <p className="mb-4">
          When you upload screenshots of your Instagram profile, we process them 
          through the Anthropic API for analysis. These screenshots are not stored 
          anywhere and are discarded after analysis. Only the generated audit results 
          are stored in our database.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
        <p className="mb-4">
          We retain your data indefinitely until you request deletion. 
          There is currently no self-serve account deletion feature available.
        </p>
        <p className="mb-4">
          Once our payment processing system (Stripe) is implemented, 
          we will retain payment information as required by law.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data Sharing</h2>
        <p className="mb-4">
          We share your data with the Anthropic API for analysis purposes. 
          We do not share your data with any third parties except as required by law.
        </p>
        <p className="mb-4">
          Once our payment processing system (Stripe) is implemented, 
          we will share payment information with Stripe as required by law.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
        <p className="mb-4">
          You have the right to access, correct, or delete your personal information. 
          Please contact us if you would like to exercise these rights.
        </p>
        <p className="mb-4">
          If you have any questions about our privacy practices, please contact us.
        </p>
      </section>
    </div>
  );
}
