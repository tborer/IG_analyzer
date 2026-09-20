# Caliber SEO & UX Growth Improvement Tasks

**Created:** 2026-08-25  
**Author:** Autonomous Dev Loop (Expert SEO/UX Analysis)  
**Status:** Awaiting implementation

---

## Executive Summary

This document contains a prioritized task list to improve **traffic acquisition (SEO)** and **conversion rates (UX)** for Caliber — the Instagram profile audit tool for dating. Based on expert analysis of the current landing page, the following improvements will:

1. Increase organic search visibility
2. Build topical authority through content hub
3. Enhance user trust and reduce bounce rate
4. Improve email capture for retargeting/lead nurturing
5. Create social proof to increase signup conversion

---

## Section 1.0: SEO Improvements (Organic Traffic Growth)

### §1.1 Implement Custom Domain Setup
**Priority:** High  
**Estimated Effort:** Medium  
**Dependencies:** None

**Description:**
Currently using `*.vercel.app` domain which has low trust score and limits SEO potential. Need to:
- Connect custom domain (user-owned or branded)
- Set up SSL certificate
- Update all URLs in code (`SITE_URL`, `metadataBase`)
- Submit sitemap to Google Search Console

**Deliverable:**
- Working custom domain configuration
- Sitemap.xml and robots.txt pointing to custom domain
- Google Search Console property created and verified

---

### §1.2 Enhance Structured Data Markup
**Priority:** High  
**Estimated Effort:** Low  
**Dependencies:** §1.1

**Description:**
Current structured data includes WebApplication and FAQPage only. Need additional schema:
- `SoftwareApplication` with proper category (`lifestyle_app` or similar)
- `Review` schema for testimonials (future blog posts)
- `BreadcrumbList` for navigation
- `SiteNavigationElement` for internal linking

**Deliverable:**
- Updated `app/page.tsx` with enhanced JSON-LD markup
- Include AggregateRating if we have user reviews/testimonials
- Add BreadcrumbList for better nav understanding

---

### §1.3 Build Blog/Content Hub Infrastructure
**Priority:** Medium  
**Estimated Effort:** High  
**Dependencies:** None

**Description:**
Create blog system to target long-tail keywords and build topical authority:
- Set up Next.js blog directory (`app/blog/[slug]`)
- Create static pages for top keyword topics:
  - `/blog/instagram-bio-for-dating`
  - `/blog/instagram-photo-tips-single-men`
  - `/blog/instagram-grid-strategy-matching`
  - `/blog/dating-profile-audit-checklist`
- Implement CMS or MDX-based content workflow

**Deliverable:**
- Blog directory structure created
- Template components for blog posts (hero, author bio, related posts)
- SEO-friendly URL structure
- Canonical tags, meta descriptions pre-populated

---

### §1.4 Create Keyword Strategy Document
**Priority:** Medium  
**Estimated Effort:** Low  
**Dependencies:** None

**Description:**
Research and document target keywords by category:
- Primary keywords: `instagram audit`, `instagram for dating`, `dating profile review`
- Secondary keywords: `instagram bio tips`, `best instagram photos dating`, `profile optimization`
- Long-tail: `instagram bio examples for men`, `how to make your instagram profile attractive`

**Deliverable:**
- Keyword research document in `/docs/keywords.md`
- Content calendar linking blog posts to keywords
- Internal linking strategy

---

### §1.5 Implement FAQ Accordion Pattern
**Priority:** Low  
**Estimated Effort:** Medium  
**Dependencies:** None

**Description:**
Convert FAQ section from vertical list to accordion for better UX and keyword targeting:
- Use `details/summary` or component library
- Target long-tail keywords in each question
- Add schema.org Question type properly to each

**Deliverable:**
- Accordion UI implemented in `app/page.tsx`
- Better mobile UX (less scrolling)
- Enhanced keyword targeting per question

---

## Section 2.0: UX & Conversion Improvements (Signup Growth)

### §2.1 Add Social Proof Elements
**Priority:** High  
**Estimated Effort:** Medium  
**Dependencies:** None

**Description:**
Add trust signals to increase conversion rates:
- Testimonials carousel or grid
- User count badge ("Trusted by 10,000+ daters")
- Trust badges (security, privacy)
- Before/after audit examples (screenshot comparisons)

**Deliverable:**
- Social proof component(s) created and integrated
- Privacy/security badges in footer or near signup
- Example audit results (anonymized if needed)

---

### §2.2 Improve Call-to-Action (CTA) Hierarchy
**Priority:** High  
**Estimated Effort:** Medium  
**Dependencies:** None

**Description:**
Optimize CTA placement and prominence:
- Primary CTA above fold with strong visual weight
- Secondary CTAs at strategic scroll points
- Microcopy improvements ("Unlock your audit" → "Get Your Free Audit Now")
- Urgency elements ("Free audit resets daily — start now")

**Deliverable:**
- Redesign header/navigation to highlight signup
- Add mid-page CTA after benefits section
- A/B test CTAs for optimization

---

### §2.3 Create Comparison/Alternative Page
**Priority:** Medium  
**Estimated Effort:** Medium  
**Dependencies:** None

**Description:**
Address user concerns by showing why Caliber is better:
- "Caliber vs Other Instagram Review Tools" page
- Comparison table (free tier, audit speed, insight depth)
- Explain why "Instagram audit" > "Tinder photo review"
- Highlight unique selling points (audit existing profile, not just uploading new photos)

**Deliverable:**
- New page at `/comparison` or embedded in relevant sections
- Honest comparison with fair framing
- Conversion-focused copy

---

### §2.4 Implement Email Lead Magnet
**Priority:** Medium  
**Estimated Effort:** Medium  
**Dependencies:** None

**Description:**
Capture emails even from users not ready to signup:
- Free resources gated by email:
  - "Instagram Bio Checklist for Dating" (PDF)
  - "Top 10 Photo Mistakes That Kill Matches" (guide)
  - Weekly dating tips newsletter sign-up
- Exit-intent popup on landing page

**Deliverable:**
- Lead magnet PDF/guide created and hosted
- Opt-in form components
- Newsletter signup flow
- Email automation setup (Resend integration)

---

### §2.5 Add Case Studies/Results Section
**Priority:** Medium  
**Estimated Effort:** High  
**Dependencies:** §2.1

**Description:**
Show real results with before/after examples:
- User stories with photos (anonymized if needed)
- "Improved matches by 40%" style metrics
- Video walkthrough of audit process
- Testimonial quotes integrated into flow

**Deliverable:**
- Case study page at `/results` or blog posts
- Visual before/after comparison carousel
- Integration with testimonials (see §2.1)

---

### §2.6 Improve Mobile UX
**Priority:** Low  
**Estimated Effort:** Medium  
**Dependencies:** None

**Description:**
Optimize for mobile-first dating app users:
- Thumb-friendly CTA placement
- Faster load on cellular data
- Simplified touch targets
- Lazy-loaded images/videos

**Deliverable:**
- Mobile-specific responsive adjustments
- Image optimization (WebP, lazy loading)
- Touch target size review

---

### §2.7 Add Trust Signals to Footer & Privacy Section
**Priority:** Low  
**Estimated Effort:** Medium  
**Dependencies:** None

**Description:**
Build trust with transparency:
- SSL badge (auto by Vercel but explicit mention helpful)
- "No photo storage" highlighted prominently
- "Human-in-the-loop audit" messaging
- Customer support/contact info
- Press/logos if applicable

**Deliverable:**
- Updated footer with expanded trust signals
- Privacy section made more visible/prominent

---

## Section 3.0: Analytics & Tracking Setup

### §3.1 Implement Event Analytics
**Priority:** High  
**Estimated Effort:** Medium  
**Dependencies:** None

**Description:**
Track key conversion events:
- `viewed_landing` on `/`
- `click_signup` on signup buttons
- `audit_started` when user uploads screenshot
- `audit_completed` after results
- `signup_success` when account created
- Add Plausible domain (mentioned in README as optional)

**Deliverable:**
- Analytics integration code
- Event schema documented
- Dashboard view for monitoring funnel

---

### §3.2 Setup Conversion Attribution
**Priority:** Medium  
**Estimated Effort:** High  
**Dependencies:** §3.1

**Description:**
Understand traffic sources and attribution:
- UTM parameter validation
- Source/medium tracking in analytics
- Landing page vs organic traffic segmentation
- Referral campaign tracking (Reddit, Product Hunt)

**Deliverable:**
- Analytics dashboard with source breakdown
- Campaign URL helper tool
- ROI reporting by channel

---

## Section 4.0: Legal & Compliance Tasks

### §4.1 Create Privacy Policy Page
**Priority:** High  
**Estimated Effort:** Medium  
**Dependencies:** None

**Description:**
Required for ads, builds trust, required in many jurisdictions:
- GDPR compliance basics
- CCPA/CPRA notice sections
- Data processing explanation (screenshots sent to API then discarded)
- Contact email for data requests
- Cookie policy integration

**Deliverable:**
- `/privacy/policy` page implemented
- Privacy URL added to footer and signups
- Plain language, not legalese

---

### §4.2 Create Terms of Service Page
**Priority:** Medium  
**Estimated Effort:** Medium  
**Dependencies:** None

**Description:**
Establish TOS for legal protection:
- Acceptable use policy
- Refund/cancellation terms (before Stripe integration)
- Dispute resolution
- Limitation of liability
- Age requirements (18+ dating app typical)

**Deliverable:**
- `/terms` page implemented
- Acceptance checkbox on signup
- Terms link in footer and settings

---

### §4.3 Implement Login Throttling
**Priority:** Medium  
**Estimated Effort:** Low  
**Dependencies:** None

**Description:**
Security hardening for auth flow:
- Rate limiting on `/api/auth/login`
- Account enumeration protection
- Captcha integration option (hCaptcha, reCAPTCHA)
- Failed login notification to user

**Deliverable:**
- Login rate limit implemented in API route
- Error message improvements
- Optional captcha for repeated failures

---

## Section 5.0: Content & Copy Improvements

### §5.1 Refine Value Proposition Headline
**Priority:** High  
**Estimated Effort:** Low  
**Dependencies:** None

**Description:**
Current headline is functional but could be more compelling:
- Current: "{SITE_NAME} audits the Instagram people check before a first date"
- Improved options:
  - "Get More Matches with a Better Dating Profile"
  - "Your Instagram is Making or Breaking Your Dates"
  - "Audit Your Instagram Before Someone Checks You Out"

**Deliverable:**
- A/B test 3 headline variants
- Test via conversion rate optimization
- Document winning version

---

### §5.2 Expand Bio Strategy Section Visibility
**Priority:** Medium  
**Estimated Effort:** Low  
**Dependencies:** None

**Description:**
Bio audit is a unique differentiator but currently less visible:
- Add visual indicator for "bio reviewed" feature
- Link to `/blog/instagram-bio-for-dating` from main page
- Highlight bio checking in "How it works" step 3

**Deliverable:**
- Bio strategy callout added to landing page
- Blog link integrated naturally
- Schema.org markup for blog updated

---

### §5.3 Improve Pricing Communication
**Priority:** Medium  
**Estimated Effort:** Low  
**Dependencies:** None

**Description:**
Free tier is strong but paid needs stronger positioning:
- "Track your progress" messaging
- "Multiple profiles daily" benefit emphasized
- Consider showing annual plan for lifetime discount
- Add FAQ: "Do I need paid to track monthly?"

**Deliverable:**
- Pricing section copy updated
- Value proposition clarified per tier
- Optional add-ons or bundles documented

---

## Section 6.0: Post-Launch Tasks

### §6.1 Launch on Social & Communities (Week 2)
**Priority:** High  
**Estimated Effort:** Low  
**Dependencies:** §1.1, §3.1

**Description:**
Execute LAUNCH_PLAN.md timeline:
- Reddit posts in r/relationships, r/dating_advice, r/socialskills
- X/Twitter threads for relationship advice communities
- Product Hunt launch (timed after billing ships)
- Prepare screenshots/videos for each platform

**Deliverable:**
- Launch posts scheduled and published
- Community engagement monitoring
- Link tracking with UTMs

---

### §6.2 Monitor & Iterate (Ongoing)
**Priority:** Medium  
**Estimated Effort:** Ongoing  
**Dependencies:** §3.1

**Description:**
A/B test improvements:
- CTA copy variants
- Headline optimization
- Testimonial placement
- Blog post performance

**Deliverable:**
- Experiment tracking sheet
- Monthly optimization report
- Feature flag system for rapid iteration

---

## Task Summary Table

| ID | Section | Task Title | Priority | Est. Effort | Dependencies |
|----|---------|------------|----------|-------------|--------------|
| §1.1 | SEO | Custom domain setup | High | Medium | None |
| §1.2 | SEO | Enhanced structured data | High | Low | §1.1 |
| §1.3 | SEO | Build blog/content hub | Medium | High | None |
| §1.4 | SEO | Keyword strategy document | Medium | Low | None |
| §1.5 | SEO | FAQ accordion pattern | Low | Medium | None |
| §2.1 | UX | Add social proof | High | Medium | None |
| §2.2 | UX | Improve CTA hierarchy | High | Medium | None |
| §2.3 | UX | Create comparison page | Medium | Medium | None |
| §2.4 | UX | Email lead magnet | Medium | Medium | None |
| §2.5 | UX | Case studies/results section | Medium | High | §2.1 |
| §2.6 | UX | Improve mobile UX | Low | Medium | None |
| §2.7 | UX | Add trust signals footer | Low | Medium | None |
| §3.1 | Analytics | Implement event tracking | High | Medium | None |
| §3.2 | Analytics | Conversion attribution | Medium | High | §3.1 |
| §4.1 | Legal | Privacy policy page | High | Medium | None |
| §4.2 | Legal | Terms of service page | Medium | Medium | None |
| §4.3 | Legal | Login throttling | Medium | Low | None |
| §5.1 | Copy | Refine headline value prop | High | Low | None |
| §5.2 | Copy | Expand bio section visibility | Medium | Low | None |
| §5.3 | Copy | Improve pricing communication | Medium | Low | None |
| §6.1 | Launch | Social/community launch | High | Low | §1.1, §3.1 |
| §6.2 | Post-Launch | Monitor & iterate | Medium | Ongoing | §3.1 |

---

## Implementation Notes

1. **Task Sizing:** Each task is designed to be completed in 1-2 days by a single developer working through one or two files.

2. **Dependencies:** Tasks marked with dependencies must be completed first (e.g., custom domain before enhanced structured data).

3. **Priority System:** 
   - High: Ship immediately, drives measurable revenue impact
   - Medium: Important but can wait for budget/resources
   - Low: Nice-to-have improvements

4. **Tracking:** Update `OUTSTANDING_WORK.md` and `FOLLOWUP.md` as tasks move through workflow.

5. **Dependencies on Billing:** Some launch tasks (§6.1) timed to occur after Stripe integration (§4) ships per original plan.

---

## Next Steps

1. Review task list with stakeholders
2. Estimate effort more precisely for each item
3. Load into dev loop backlog via `load_tasks()`
4. Begin implementation on highest priority items
5. Monitor analytics as work progresses

---

**End of Document**
