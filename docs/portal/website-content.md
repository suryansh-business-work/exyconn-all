# Where exyconn.com gets its content

The public Astro site ([`exyconn-website`](../../exyconn-website)) reads from two sources,
and the Website portal has screens that currently feed neither. This page records which is
which, so nobody has to work it out from the imports again.

## Read from the portal

Through `src/lib/portal/*`, against the unauthenticated `public*` resolvers in
[`server/src/modules/website`](../../exyconn-portal/server/src/modules/website) and the
Branding and Legal modules:

| Site area | Portal query | Portal screen that edits it |
|---|---|---|
| Careers — companies | `publicJobCompanies`, `publicJobCompany` | Website > Companies |
| Careers — jobs | `publicJobs`, `publicJob` | Website > Jobs |
| Careers — gigs | `publicGigs`, `publicGig` | Website > Freelance Gigs |
| Tools directory (`/our-tools`) | `publicToolCategories`, `publicTools`, `publicTool` | Website > Tool Categories, Website > Tools |
| Header / footer navigation | `publicNavLinks` | Website > Navigation Links |
| Branding (name, logos, colours, socials) | `publicBranding` | Admin > Branding |
| Policy pages (`/policies/*`) | `publicPolicies`, `publicPolicy` | Legal > Policies |
| Form submissions (write) | `createWebsiteSubmission` | Website > Form Submissions |
| The form-type allow-list | `websiteFormTypes` | — (server constant) |

Branding is the one query allowed a bundled fallback (`getBrandingSafe`) because it renders
on every page; everything else fails loudly rather than serving stale content.

## Read from TinaCMS markdown

Authored in `exyconn-website/src/content/` and read through `src/lib/content/*`. The editor
is the self-hosted TinaCMS at `tina-cms.exyconn.com`:

| Site area | Source |
|---|---|
| Blog (`/blog`, `/blog/[slug]`) | `src/content/blog/*.md` |
| Case studies (`/case-studies`, `/case-studies/[slug]`) | `src/content/case-studies/*.md` |

## The portal screens with no consumer

**Website > Blog** and **Website > Case Studies** are full CRUD screens backed by
`BlogPostModel` / `CaseStudyModel`, with working `publicBlogPosts` / `publicCaseStudies`
resolvers — and nothing on the public site reads them. The site takes both from Tina
markdown instead. Anything typed into those two portal screens today is written to the
database and never rendered anywhere.

This is a product decision, not a bug to fix in passing, so it is written down rather than
resolved:

- **Option A — wire the site to the portal.** Point `/blog` and `/case-studies` at
  `publicBlogPosts` / `publicCaseStudies` the way `/our-tools` and `/career` already work,
  retire `src/content/blog` and `src/content/case-studies`, and drop TinaCMS along with its
  self-hosted backend (Mongo + GitHub + next-auth) and the `tina-cms.exyconn.com` host. One
  editor for everything, one deployment fewer. Costs a content migration from markdown to
  Mongo, and loses Tina's in-page visual editing.
- **Option B — retire the portal screens.** Delete Website > Blog and Website > Case
  Studies along with their models and `public*` resolvers, and leave long-form content to
  Tina. Smaller portal, no migration, but long-form content stays outside the portal's
  roles, audit log and permission model.

Until one of those is chosen, the two screens should be read as unwired: a change there has
no effect on exyconn.com.

## A second unreconciled tools catalogue

`/tools` and `/tools/[...slug]` on the Astro site are **301 redirects** to
`https://tools.exyconn.com`, the standalone [`exyconn-tools`](../../exyconn-tools) app,
which has its own API and its own content. That redirect is why the portal-driven directory
added here lives at **`/our-tools`** rather than `/tools` — taking `/tools` would have
silently overridden a deliberate redirect and broken the inbound links it preserves.

So there are now two tools catalogues: `tools.exyconn.com` (its own app) and `/our-tools`
(the portal's Tools CRUD). Reconciling them — one of them wins, or they cover different
things and say so — is the same kind of product decision as the blog one above.
