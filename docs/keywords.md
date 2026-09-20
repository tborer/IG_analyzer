# Keyword Strategy — Caliber

**Status:** Working doc, revisit as blog content ships and search-console
data becomes available (post custom-domain setup, §1.1 in
`docs/seo-ux-improvements.md`). Until then this is a starting hypothesis
based on the product's own positioning, not verified with real search-volume
tooling — treat volume/difficulty claims below as directional, not measured.

## Primary keywords (target: `/`, homepage title/description)

| Keyword | Intent | Notes |
|---|---|---|
| instagram audit | Informational/navigational | Core product category term |
| instagram audit for dating | Informational | Most specific match to product |
| dating profile review | Informational | Adjacent category, higher volume |
| instagram for dating | Informational | Broad, high competition |

## Secondary keywords (target: blog posts, FAQ copy)

- instagram bio tips for dating
- best instagram photos for dating
- instagram profile optimization
- dating profile audit checklist
- instagram grid strategy

## Long-tail keywords (target: individual blog post titles/slugs)

- instagram bio examples for men
- how to make your instagram profile attractive
- instagram photo tips for single men
- what does your instagram grid say about you
- instagram mistakes that hurt your dating life
- dating profile checklist before a first date

## Content calendar → blog mapping

| Blog post (see `content/blog/`) | Slug | Primary keyword targeted |
|---|---|---|
| The Instagram Bio Checklist Daters Actually Read | `instagram-bio-for-dating` | instagram bio tips for dating |
| What Your Instagram Grid Says About You in the First 3 Seconds | `instagram-grid-strategy-matching` | instagram grid strategy |
| The Dating Profile Audit Checklist | `dating-profile-audit-checklist` | dating profile audit checklist |

Future candidates (not yet written): `instagram-photo-tips-single-men`,
`instagram-mistakes-that-hurt-your-dating-life`.

## Internal linking strategy

- Every blog post links back to `/` and to `/signup` with descriptive anchor
  text (never "click here").
- The landing page's "How it works" step 3 (bio review) links to the bio
  blog post — see §5.2.
- Once 4+ posts exist, add a "From the blog" teaser section to the landing
  page linking 2-3 recent posts (deferred until there's enough content to
  make that section worth a full section of the page).
- Between posts: manually curated "related reading" links where topically
  relevant — no recommendation engine needed at this post count.

## Next steps once a custom domain + Search Console exist

1. Pull actual query data from Search Console after ~4-6 weeks of indexing.
2. Replace directional keyword picks above with verified high-value queries.
3. Expand the blog post list based on what's actually driving impressions
   but not yet ranking well (the "second page" opportunity queries).
