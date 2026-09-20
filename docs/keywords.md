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

| Blog post (see `lib/blog.ts`) | Slug | Primary keyword targeted |
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

## UTM conventions for launch distribution (§3.2, §6.1)

No attribution tracking is wired into the app yet (§3.2 in
`docs/seo-ux-improvements.md` is still open — this is just the naming
convention to use once it is, and for any manual link-sharing before then).
Standard `source`/`medium`/`campaign` structure:

```
https://<domain>/signup?utm_source=<source>&utm_medium=<medium>&utm_campaign=<campaign>&utm_content=<content>
```

Examples for the §6.1 launch distribution list:

- Reddit post in r/dating_advice:
  `?utm_source=reddit&utm_medium=social&utm_campaign=launch&utm_content=r_dating_advice`
- X/Twitter thread:
  `?utm_source=twitter&utm_medium=social&utm_campaign=launch&utm_content=dating_tech_thread`
- Product Hunt:
  `?utm_source=producthunt&utm_medium=referral&utm_campaign=launch`

Keep `utm_campaign` stable per distinct push (e.g. `launch`, not a
per-post value) so results roll up cleanly; use `utm_content` to
distinguish individual posts/threads within the same campaign.

## Next steps once a custom domain + Search Console exist

1. Pull actual query data from Search Console after ~4-6 weeks of indexing.
2. Replace directional keyword picks above with verified high-value queries.
3. Expand the blog post list based on what's actually driving impressions
   but not yet ranking well (the "second page" opportunity queries).
