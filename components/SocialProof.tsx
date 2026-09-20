import { BadgeCheck, Shield, Lock, Users } from 'lucide-react';
import Link from 'next/link';

interface SocialProofProps {
  userCount?: number; // Will be dynamically fetched from DB
  testimonials?: Array<{
    rating: number;
    text: string;
    author?: string;
    role?: string;
  }>;
}

// Placeholder data - will connect to real database
const USER_COUNT = parseInt(process.env.NEXT_PUBLIC_USER_COUNT || '5000', 10);
const TESTIMONIALS: SocialProofProps['testimonials'] = [
  {
    rating: 4.9,
    text: "I got more matches after fixing my profile with Caliber",
    author: "Michael, dating coach",
  },
];

export default function SocialProof({ userCount, testimonials }: SocialProofProps) {
  const safeUserCount = userCount ?? USER_COUNT;
  return (
    <section className="border-b border-hair py-8 bg-brass/5">
      <div className="container max-w-3xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 gap-6 items-center">
          {/* Testimonials */}
          <div>
            <h3 className="font-display text-xl mb-4">Trusted by daters everywhere</h3>
            {testimonials && testimonials.length > 0 ? (
              <div className="space-y-4">
                {testimonials.map((testimonial, idx) => (
                  <div key={idx} className="bg-brass/10 p-4 rounded-lg border border-hair">
                    <div className="flex items-center gap-1 mb-2">
                      {'★'.repeat(Math.floor(testimonial.rating))}
                      {testimonial.rating > Math.floor(testimonial.rating) && '☆'}
                    </div>
                    <p className="text-sm text-bone/80">&ldquo;{testimonial.text}&rdquo;</p>
                    {testimonial.author && (
                      <p className="text-xs text-mist mt-2">— {testimonial.author}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-bone/60 italic">
                Reviews coming soon! Be the first to share your results.
              </p>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="flex flex-col items-center text-center p-3 rounded-lg bg-brass/5 border border-hair">
              <Users className="w-8 h-8 text-brass mb-2" />
              <p className="font-mono text-xl font-bold text-bone">{safeUserCount.toLocaleString()}</p>
              <p className="text-xs text-mist">profiles reviewed today</p>
            </div>

            <div className="flex flex-col items-center text-center p-3 rounded-lg bg-brass/5 border border-hair">
              <Lock className="w-8 h-8 text-brass mb-2" />
              <p className="text-sm font-medium text-bone">No photo storage</p>
              <p className="text-xs text-mist">Screenshots processed securely, then discarded</p>
            </div>

            <div className="flex flex-col items-center text-center p-3 rounded-lg bg-brass/5 border border-hair">
              <Shield className="w-8 h-8 text-brass mb-2" />
              <p className="text-sm font-medium text-bone">Secure & Private</p>
              <p className="text-xs text-mist">SSL encrypted • No data retention</p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy/policy" className="text-mist hover:text-bone underline decoration-dotted underline-offset-2">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="text-mist hover:text-bone underline decoration-dotted underline-offset-2">
            Terms of Service
          </Link>
          <span>•</span>
          <a href="https://stripe.com" className="text-mist hover:text-bone">
            Powered by Stripe
          </a>
        </div>
      </div>
    </section>
  );
}
