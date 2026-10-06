# Where exyconn.com gets its content

Everything. The public Astro site ([`exyconn-website`](../../exyconn-website)) holds no
content of its own — every word, image and link on it is authored in the portal and read at
request time through `src/lib/portal/*`, against the unauthenticated `public*` resolvers in
[`server/src/modules/website`](../../exyconn-portal/server/src/modules/website) and the
Branding and Legal modules.

| Site area                                              | Portal query                                        | Portal screen that edits it                |
| ------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------ |
| Blog (`/blog`, `/blog/[slug]`)                         | `publicBlogPosts`, `publicBlogPost`                 | Website > Blog                             |
| Case studies (`/case-studies`, `/case-studies/[slug]`) | `publicCaseStudies`, `publicCaseStudy`              | Website > Case Studies                     |
| Careers — companies                                    | `publicJobCompanies`, `publicJobCompany`            | Website > Companies                        |
| Careers — jobs                                         | `publicJobs`, `publicJob`                           | Website > Jobs                             |
| Careers — gigs                                         | `publicGigs`, `publicGig`                           | Website > Freelance Gigs                   |
| Tools directory (`/our-tools`)                         | `publicToolCategories`, `publicTools`, `publicTool` | Website > Tool Categories, Website > Tools |
| Header / footer navigation                             | `publicNavLinks`                                    | Website > Navigation Links                 |
| Branding (name, logos, colours, socials)               | `publicBranding`                                    | Admin > Branding                           |
| Policy pages (`/policies/*`)                           | `publicPolicies`, `publicPolicy`                    | Legal > Policies                           |
| Form submissions (write)                               | `createWebsiteSubmission`                           | Website > Form Submissions                 |
| The form-type allow-list                               | `websiteFormTypes`                                  | — (server constant)                        |

Branding is the one query allowed a bundled fallback (`getBrandingSafe`) because it renders
on every page; everything else fails loudly rather than serving stale content.

`/blog` and `/case-studies` only publish rows with `isActive`, newest `publishedAt` first —
so an unfinished post is a draft simply by being inactive.

## Article bodies are HTML

`BlogPost.content` and `CaseStudy.content` are HTML, the same contract as job descriptions,
gig descriptions and policy bodies. The site sanitises every one of them
(`sanitizeArticleHtml`, allow-listed tags, attributes and inline styles) before rendering it
with `set:html` inside `.article-body`, styled by
[`styles/article.css`](../../exyconn-website/src/styles/article.css).

There are two ways to write a body, and both produce that HTML:

- **Rich text** — every HTML field in the Website module (and policies, project docs,
  tickets, the tracker consent text) uses `RhfRichText`, i.e. the `@exyconn/rich-text`
  editor: headings, marks, colour, alignment, lists and check lists, links, tables, and
  images uploaded to ImageKit.
- **Live edit** — the _Live edit_ row action on Blog and Case studies opens
  `@exyconn/live-editor` (GrapesJS) full-screen at `/website/blog/:id/live-edit` or
  `/website/case-studies/:id/live-edit`. Its canvas loads
  `https://exyconn.com/styles/article-canvas.css` (the same `article.css`, plus the font and
  reset the page layout would supply), so the design looks as it will on the page. It saves
  the body HTML to `content` and the CSS its styles need to `contentCss`; the detail page
  prints that CSS nested under `.article-body` (`scopeArticleCss`), so it cannot reach the
  rest of the page.

A body with `contentCss` is shown in the edit form as "Designed in the live editor" instead
of the rich-text editor, which cannot represent its layout; _Edit as rich text_ clears the
design on purpose.

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

## The chat widget (Website > Chatbot)

exyconn.com and tools.exyconn.com carry the same chat, served by the website as an iframe
page, [`/embed/chat`](../../exyconn-website/src/pages/embed/chat.astro): a React + MUI app
(`exyconn-website/src/components/chat-embed`) themed from the site's tokens. Any site embeds
it with one line:

```html
<script src="https://exyconn.com/embed/chat.js" data-site="TOOLS" defer></script>
```

The loader ([`public/embed/chat.js`](../../exyconn-website/public/embed/chat.js), dependency
free) waits for an idle moment, adds one fixed iframe in the bottom-right corner and resizes it
when the chat opens or closes (full screen on phones). The two sides talk over `postMessage`
only with the embed origin: the iframe sends `ready`, `resize` and `unread` (the loader puts
"(n) " in front of the host page's title), and the loader sends the page URL (recorded as the
session's page) and the host's light/dark theme. The website itself uses the same loader from
`src/layouts/Page.astro` (`data-site="WEBSITE"`); tools reads the loader URL from
`VITE_CHAT_EMBED_URL`. The middleware lets only the origins in `CHAT_FRAME_ANCESTORS` (default
`https://tools.exyconn.com`, plus the site itself) frame `/embed/*`, marks it `noindex` and
allows the microphone there for voice notes.

The chat talks to portal-server over one WebSocket, `/chat/ws`
([`modules/website-chat`](../../exyconn-portal/server/src/modules/website-chat)), derived at
request time from `PUBLIC_PORTAL_GRAPHQL_URL`. The socket only accepts the origins in
`CHAT_ORIGINS` (the public sites) and `CORS_ORIGIN` (the portals, whose Website > Chatbot
console answers over the same socket); since the iframe always runs on exyconn.com, that is
the origin the server sees from every host site.

- **Sign-in.** A visitor gives a name, an email and optionally a phone; the email is proved with
  a one-time code (`website-chat-code`). That opens a session, files a support ticket on the
  `CHAT` channel (linked back to the session) and sends `website-chat-started` with the ticket
  reference. Closing the chat emails `website-chat-transcript` when the settings ask for it.
- **Three tabs.** "Chat with us" is people only; "Knowledge Bot" is the configured OpenAI model
  (gpt-4o by default, key from Tech > Environment Variables) answering only from the knowledge
  below and refusing anything else with the configured message; "FAQs" are Website > Chatbot >
  FAQs and need no sign-in.
- **Handoff.** A live question nobody answers within the configured wait, or one asked outside
  the opening hours, is handed to the bot inside the live thread itself (a notice, then the
  bot's answer). The team can still reply there. Each thread only ever holds what was asked
  in it.
- **Knowledge.** "Sync website content" reads every sitemap page of one market
  (`CHAT_KNOWLEDGE_MARKET`, default `en-us`) from `WEBSITE_URL` plus every published blog post
  and case study, replacing the previous sync. Rows written in the portal (CUSTOM) are never
  touched by a sync.
- **Records.** Sessions, both threads, settings, FAQs and knowledge live in MongoDB under the
  platform operator's company; pictures, clips and voice notes go to ImageKit
  (`/exyconn-portal/website-chat`).
