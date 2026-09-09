# Where exyconn.com gets its content

Everything. The public Astro site ([`exyconn-website`](../../exyconn-website)) holds no
content of its own — every word, image and link on it is authored in the portal and read at
request time through `src/lib/portal/*`, against the unauthenticated `public*` resolvers in
[`server/src/modules/website`](../../exyconn-portal/server/src/modules/website) and the
Branding and Legal modules.

| Site area | Portal query | Portal screen that edits it |
|---|---|---|
| Blog (`/blog`, `/blog/[slug]`) | `publicBlogPosts`, `publicBlogPost` | Website > Blog |
| Case studies (`/case-studies`, `/case-studies/[slug]`) | `publicCaseStudies`, `publicCaseStudy` | Website > Case Studies |
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

`/blog` and `/case-studies` only publish rows with `isActive`, newest `publishedAt` first —
so an unfinished post is a draft simply by being inactive.

## Article bodies are HTML

`BlogPost.content` and `CaseStudy.content` are HTML, the same contract as job descriptions,
gig descriptions and policy bodies. The editor screens say so, and the site sanitises the
value (`sanitizeArticleHtml`, allow-listed tags and attributes) before rendering it with
`set:html`.

The bodies were seeded by
[`modules/website/seed`](../../exyconn-portal/server/src/modules/website/seed), which upserts
each fixture with `$setOnInsert` keyed on its slug — so a redeploy never overwrites an edit
made in the portal, and the database is the source of truth from the first boot onwards.

## Two tools surfaces, on purpose

They are **not** one catalogue, and neither is going away:

- **`/our-tools`** — the marketing directory, driven by the portal's Tools CRUD. It says what
  Exyconn builds, who it is for and what it costs, one page per tool at
  `/our-tools/[toolCode]`.
- **`tools.exyconn.com`** — the standalone [`exyconn-tools`](../../exyconn-tools) app, which
  is where the tools actually run.

A portal Tool row records the app path (`/tools/<slug>`) in its `url`. The site 301s every
`/tools/*` URL to the tools app, which would drop the slug, so `getToolLaunchUrl` resolves it
against `tools.exyconn.com` instead: the directory card and the "Open" button on the detail
page both deep-link to the tool itself. `/our-tools` rather than `/tools` remains the
directory's address so that redirect — and the inbound links it preserves — stays intact.
