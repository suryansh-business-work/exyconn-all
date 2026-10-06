# Moving an exyconn.com page into the CMS

Every page of exyconn.com moves from a hand-written Astro file (`exyconn-website/src/pages/[market]/…`)
into the CMS, one page at a time, without a visible change. The home page was the first; this is
the recipe it followed, with the home page as the worked example.

## How a CMS page is rendered

- `exyconn-website/src/pages/[market]/[...path].astro` serves every market URL that has no page
  file of its own. It resolves the site from the Host header (`getCmsSite`, cached 30 s), reads
  `publicCmsPage(siteId, '/' + path)` (an exact page, else a published TEMPLATE such as
  `/blog/:slug`, whose params reach components as `cms.params`), and renders it with
  `layouts/CmsPage.astro`. Nothing published there is the usual 404.
- **Explicit page files win over the catch-all.** Deleting a page file hands its URL to the CMS.
- `CmsPage.astro` wraps the page in `layouts/SiteShell.astro` (the same document `Page.astro` uses:
  head, SEO via `@exyconn/seo`, market alternates, GTM, skip link, modals, chat loader). The header
  and footer are the site's header/footer fragments (`chrome.header` / `chrome.footer`), the design
  system is written as CSS custom properties, then the site's global CSS, the fragments' and the
  page's CSS, and the site's head/body markup.
- `components/cms/CmsBlocks.astro` renders the block tree: `html` blocks as written, `component`
  blocks through `components/cms/registry.ts` (props spread, plus `cms` — branding, params,
  fragments — and children in the default slot), `fragment` blocks as their published blocks.
- Copy may name `{serviceCount}`; `fillCopy` (src/lib/cms/variables.ts) fills it, in component
  copy and in the page's SEO title/description.
- A page's JSON-LD may also name `{siteUrl}`, `{marketUrl}` (site + the reader's market, e.g.
  `https://exyconn.com/en-us`) and `{businessName}`; `fillJsonLd` fills them per request, so a
  breadcrumb is seeded as `"item": "{siteUrl}/about-us"`, never with a hard-coded domain.

## The recipe

1. **List what the page renders.** Open the page file and note each section component, the props
   it passes, and every `src/lib/**` data file the components read copy from.
2. **Make each section take all its copy as props.** Move every string, list and link the
   component used to import into its `Props` (typed in the component; shared shapes in a
   `types.ts` beside the components, e.g. `components/home/types.ts`). Keep in the component:
   markup, Tailwind classes, icons-as-classes chosen by position, and data that drives routing or
   is shared with other pages (e.g. the AI service catalogue, `lib/services/aiServices.ts`).
   - **Never move Tailwind class names into props.** Tailwind only generates classes it finds in
     `exyconn-website/src`; a class that exists only in the seed renders unstyled.
   - Data the company edits elsewhere stays there: the closing chapter still reads Admin › Branding
     through `cms.branding`.
   - A number the site counts for itself goes into copy as a `{placeholder}` (see `VARIABLES`).
3. **Add catalogue entries** in `packages/cms/src/catalogue/<area>.ts` (key `area.name`, label,
   category, description, `acceptsChildren: true` for a wrapper) with `defaultProps` = the page's
   real current copy. Long copy goes in `<area>.copy*.ts` beside it. Export the list
   `as const satisfies readonly CmsComponentDef[]` and add it to `CATALOGUE` in
   `catalogue/index.ts`. Then `pnpm --filter @exyconn/cms build` (the server reads `dist`).
   Prop shapes must suit the shape-driven editor: arrays of objects whose first item has every
   field (`flag: ''`, `external: false`), an array of rows as `[{ logos: [...] }]`, not arrays of
   arrays.
4. **Register the renderers** in `exyconn-website/src/components/cms/registry.ts`. The
   `satisfies Record<CmsComponentKey, …>` check fails `pnpm typecheck` if a key has no renderer
   or a renderer has no key. Every registered component's CSS ships with every CMS page, so keep
   component CSS scoped (`<style>`) or namespaced.
5. **Seed the page** in `exyconn-portal/server/src/modules/cms/seed/exyconn/pages/<page>.ts` and
   add it to `seed/exyconn/pages.ts`. Build the HTML with `componentPlaceholder(key, props, children)`
   (home uses a `section(key)` helper that takes the catalogue defaults); nest children inside a
   wrapper's placeholder; plain HTML between components is allowed. Copy title, description and
   keywords exactly from the old page (`seo.title`, `seo.description`, `seo.keywords`; set
   `canonical`, `ogImageUrl`, `jsonLd` only if the old page passed them). The seed is insert-only
   and per key: a new page arrives on the next boot, an edited one is never overwritten.
6. **Delete the page file** and every lib data file nothing else imports any more (grep first —
   e.g. `lib/home/process.ts` stayed because `DetailProcess.astro` still reads it).
7. **Check** `pnpm --filter exyconn <script>` for `typecheck`, `lint`, `format:check`, `test` and
   `build`; server
   `tsc --noEmit` + `eslint src/modules/cms` + `prettier --check src/modules/cms`, and
   `@exyconn/cms` typecheck/lint.
8. **Prove parity** (below) and explain every remaining difference.

Worked example — home: `[market]/index.astro` deleted; `HomeStage`, `HeroChapter`,
`SolutionsChapter` (+`ServiceCatalogue`), `IndustriesChapter` (+`ProcessTrack`), `PartnerChapter`,
`PlatformsMarquee`, `ClosingChapter` take props; catalogue `catalogue/home.ts` + `home.copy.ts` +
`home.copy-more.ts`; seed `seed/exyconn/pages/home.ts`; `lib/home/{hero,solutions,industries,
platforms,why-choose-us}.ts` and `lib/tech-logos.ts` deleted.

## Proving parity (two steps)

The production baseline (`<scratchpad>/baseline`, commit bd032a80, production API) differs from a
local run in DB content (branding, navigation), so compare the migrated site with **the old site
run against the same API**:

1. **Local stack** (scratchpad `cmsrun/`, nothing committed):
   - in-memory MongoDB: `node cmsrun/mongo.mjs` → `mongodb://127.0.0.1:27991/exyconn-cms?replicaSet=testset`;
   - portal server (seeds the CMS on boot): in `exyconn-portal/server`,
     `MONGODB_URI=… JWT_SECRET=<32+ chars> NODE_ENV=development PORT=4504 npx tsx src/server.ts`;
   - GraphQL proxy `node cmsrun/proxy.mjs` on **4505**: CMS queries (`publicCms*`) → local server,
     everything else → production, so branding/navigation equal the baseline's.
2. **Old site** — worktree `<scratchpad>/old-wt` at bd032a80 (already installed and built):
   `cd old-wt/exyconn-website && PUBLIC_PORTAL_GRAPHQL_URL=http://127.0.0.1:4505 npx astro build`,
   run `HOST=127.0.0.1 PORT=4511 PUBLIC_PORTAL_GRAPHQL_URL=http://127.0.0.1:4505 node dist/server/entry.mjs`,
   capture once: `node baseline/capture.mjs http://localhost:4511 baseline-local` (done; reuse it).
3. **Migrated site** — build `exyconn-website` with the same env, run it on **4510**, then
   `node baseline/capture.mjs http://localhost:4510 <dir>` and
   `node baseline/compare.mjs baseline-local <dir>`.
4. Screenshots: `node baseline/shots.mjs http://localhost:4510 <url-list> <out>` (and 4511 for the
   old site); the WebGL stage differs by a few thousand pixels between two runs of the *same* build,
   so compare visually, not by exact pixel count.

**Expected differences** on every page (accepted): stylesheet chunk names (`/_astro/agentic.css` →
`/_astro/_path_.css`, same rules), the shell script renamed (`Page.astro_…` → `SiteShell.astro_…`),
and on CMS pages one `<style>` with the design-system custom properties (equal to the token
plugin's values). Anything else is a regression to fix or explain. Home result: only these.
