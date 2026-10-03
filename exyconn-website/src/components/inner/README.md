# Inner-page components

The shared kit for every page that is not the home page. Pages compose these; content comes
from `src/lib/<page>/*.ts`, Tina or the portal API — never hardcoded in the component.
Styles live in `src/styles/inner-stage.css` (each component imports it; it pulls in the home
stage's `.stage-title`, `.stage-label`, `.glass`, `.stage-rule`). Types are re-exported from
`./types.ts`.

**Theme rule.** Night objects carry `data-theme="dark"` and look the same in both site
modes: `InnerStage` (hero and band), `CtaBand`, `DemoArtefact`. Everything else follows the
site's light/dark theme — use `.inner-panel` / `.inner-card` for surfaces there, never
`.glass` (it is a dark surface and fails contrast in light mode).

**Accent.** Every component with a `family` prop sets `data-accent`; that page family's pair
then drives `--accent-a/-b` (bright, for night bands) and `--accent-a-ink/-b-ink` (text on page
surfaces, contrast-tested in both modes).

| family     | pair            | pages                                        |
| ---------- | --------------- | -------------------------------------------- |
| `company`  | violet + amber  | about, vision, careers, jobs, gigs, legal    |
| `services` | violet + cyan   | services hub/detail, ai-services, our-tools  |
| `ai`       | fuchsia + cyan  | ai/\* hub and capabilities, order-agents     |
| `proof`    | cyan + amber    | case studies                                 |
| `blog`     | sky + violet    | blog list and articles                       |
| `contact`  | fuchsia + amber | contact, get a quote, grievance, india offer |

## One page, in order

```astro
<Page title="…" description="…" jsonLd={breadcrumbJsonLd(crumbs, SITE_URL)}>
  <InnerStage
    family="services"
    crumbs={crumbs}
    title={copy.title}
    lede={copy.lede}
    primary={copy.primary}
    secondary={copy.secondary}
    scene={{ shapes: ["lattice"] }}
  />
  <ProofStrip variant="stats" label="Results" items={stats} />
  <section class="inner-section stage-shell">
    <ChapterHeading index={1} label="What we deliver" title={copy.deliverTitle} />
    <div class="grid gap-4 md:grid-cols-3 mt-10">{cards.map((c) => <LinkCard {...c} />)}</div>
  </section>
  …
  <CtaBand family="services" title={copy.ctaTitle} primary={copy.ctaAction} />
</Page>
```

Wrap body chapters in `<section class="inner-section stage-shell">` (vertical rhythm, the
heading reveal and the 80rem shell). One `InnerStage` and at most one `FaqAccordion` per page.

## Components

### InnerStage — the night hero / header band

| prop                   | type                         | notes                                                                                  |
| ---------------------- | ---------------------------- | -------------------------------------------------------------------------------------- |
| `family`               | `PageFamily`                 | required                                                                               |
| `variant`              | `"hero"` \| `"band"`         | hero 78svh (default); band 30–38svh                                                    |
| `crumbs`               | `{ label, href? }[]`         | mono breadcrumb; last crumb = current page                                             |
| `title`                | `string`                     | ≤ 8 words, sentence case in source                                                     |
| `lede`                 | `string?`                    | 1–2 lines                                                                              |
| `primary`, `secondary` | `{ label, href, external? }` | solid + ghost CTA                                                                      |
| `scene`                | `SceneConfig?`               | see below; omit for no scene                                                           |
| `headingId`            | `string?`                    | default `page-title`                                                                   |
| slot (default)         |                              | under the CTAs: meta, chips, a date                                                    |
| slot `media`           |                              | shown in the scene's place when no `scene` (tool detail: screenshot in a device frame) |

Hero: H1 is uppercase by CSS. Band: sentence-case title — use it for articles, legal,
job/gig/company detail, contact, sitemap (decision 5: every page gets a scene). Phones put
the scene **above** the title (42svh hero, 30svh band); desktop fills the stage behind the
right half. When the stage scrolls away the scene dims to 25% and freezes.

### ChapterHeading

`index`, `label`, `title`, `lede?`, `id?`, `level?: "h2" | "h3"`, default slot.
Renders "01 — LABEL", the measurement rule and the H2 (revealed on entry).

### ProofStrip — exactly one kind of proof

```astro
<ProofStrip variant="stats" label="Results" items={[{ value: "99.9%", label: "Uptime" }]} />
<ProofStrip
  variant="logos"
  label="Clients"
  items={[{ name: "Acme", src: "/logos/acme.svg", href: "https://acme.com" }]}
/>
<ProofStrip
  variant="badges"
  label="Certifications"
  items={[{ label: "ISO 27001", detail: "2025" }]}
/>
```

Stats: the final value is in the HTML; its first number counts up once in view (skipped
under reduced motion). Logos: a marquee that pauses on hover/focus and wraps statically under
reduced motion. Only proof that already exists on the site/portal (decision 3).

### LinkCard / MetricCard

```astro
<LinkCard
  href="/services/x"
  index="S/03"
  title="…"
  text="one-line outcome"
  tags={["Web", "Mobile"]}
  more="Explore"
  highlight={2}
  level="h3"
  external={false}
/>
<MetricCard
  value="42%"
  label="Faster claims processing"
  context="Insurance"
  link={{ label: "Read the story", href: "/case-studies/x" }}
/>
```

`highlight` lights that tag in the stage scene while the card is hovered or focused.

### StepTrack

`steps: { title, text, when? }[]`, `highlights?: number[]` (tag per step). Vertical on phones,
horizontal (up to 5 columns) from 1024px. Replaces the home `ProcessTrack` on inner pages.

### ArchitectureDiagram

`title` (accessible name + caption), `layers: { label, nodes: string[] }[]`, `id?` (unique if
two on a page). Layers stack top to bottom, ≤ 3 nodes per row; node captions ≤ 18 characters.
Bands light up in sequence when the figure enters.

### DemoArtefact

`title`, `caption` (sr-only description), `kind: "chat" | "trace" | "config" | "custom"`,
`messages?: { from: "user" | "agent", text }[]`, `steps?: { label, detail? }[]`, `code?: string`.
`custom` renders the default slot.

### FilterBar — chips + search + sort, synced to the URL

```astro
<FilterBar
  target="studies"
  label="Filter case studies"
  sheetLabel="Filters"
  groups={[{ param: "industry", label: "Industry", allLabel: "All", options }]}
  search={{ param: "q", label: "Search", placeholder: "Search stories" }}
  sort={{
    param: "sort",
    label: "Sort",
    options: [
      { value: "", label: "Featured" },
      { value: "-date", label: "Newest" },
    ],
  }}
  countTemplate="{shown} of {total} stories"
/>
<ul id="studies">
  <li
    data-filter-item
    data-filter-industry="health finance"
    data-search="title summary"
    data-sort-date="20260901"
  >
    …
  </li>
</ul>
<p data-filter-empty="studies" hidden>No stories match.</p>
```

`data-filter-<param>` takes space-separated values; sort values are `key` (ascending) or
`-key` (descending) against `data-sort-<key>` (numbers compare as numbers). Query example:
`?industry=health&q=voice&sort=-date`. Phones: the chip groups open as a bottom sheet.

### StickyToc + ReadingProgress

`<StickyToc label="On this page" items={[{ id, label }]} />` — sticky rail from 1024px,
collapsible on phones, `aria-current` on the section being read.
`<ReadingProgress target="article-id" />` — 2px bar at the top of the viewport.

### FaqAccordion

`items: { question, answer }[]` (plain-text answers), `structuredData?: boolean` (default true
→ FAQPage JSON-LD). Native `<details>`.

### CtaBand

`family`, `title`, `label?`, `text?`, `primary?`, `secondary?`, `echo?` (default true),
`echoShape?` (index into the scene's shapes, default 0), `headingId?`, default slot (a mini
form). The echo host is where the page's scene re-forms small once the hero is gone.

### SplitFormShell / MultiStepFormShell — layout only

```astro
<SplitFormShell title="…" lede="…" points={["…"]} formLabel="Send us a message" headingLevel="h1">
  <ContactForm />
  <!-- existing form component -->
  <div slot="aside">direct channels, small proof</div>
</SplitFormShell>

<MultiStepFormShell
  steps={["Service", "Scope", "Contact", "Review"]}
  progressTemplate="Step {current} of {total}"
  current={0}
>
  <QuoteForm client:load />
  <div slot="summary">desktop summary panel</div>
  <div slot="after">what happens next</div>
</MultiStepFormShell>
```

The form reports its step with `announceFormStep(index)` from
`src/scripts/inner/form-step.ts`; the shell updates the bar and the "Step x of n" text.

### RoleRow / GigCard

```astro
<ul><RoleRow href="…" title="…" department="…" location="Remote" type="Full-time" pay="…" /></ul>
<GigCard href="…" title="…" pay="₹40,000" scope="…" skills={["Astro"]} deadline="Apply by 12 Oct" />
```

`RoleRow` renders an `<li>`; put rows in a `<ul>` under a department heading. Pay only when
the posting has it.

### LegalLayout + LegalSection

```astro
<LegalLayout
  title="Privacy policy"
  crumbs={crumbs}
  updatedLabel="Last updated"
  updated={{ iso: "2026-10-01", text: format(date, "d MMMM yyyy", { locale }) }}
  summaryTitle="In plain words"
  summary={["…", "…", "…"]}
  tocLabel="On this page"
  sections={sections}
  scene={{ shapes: ["shield"] }}
>
  {
    sections.map((s, i) => (
      <LegalSection id={s.id} number={i + 1} title={s.label} anchorLabel="Link to this section">
        …
      </LegalSection>
    ))
  }
  <div slot="after">privacy contact, related policies</div>
</LegalLayout>
```

Band header with a scene (default `shield`; `documents` suits policies), TOC on the left,
70ch column. `family` defaults to `company`.

### ArticleLayout

```astro
---
const { html, toc } = withHeadingIds(sanitizeArticleHtml(post.body)); // src/lib/inner/headings.ts
---

<ArticleLayout
  title={post.title}
  crumbs={crumbs}
  category="AI"
  author="…"
  published={{ iso, text }}
  readTime="6 min read"
  image={{ src, alt, width, height }}
  tocLabel="On this page"
  toc={toc}
  scene={{ shapes: ["constellation"], data: { constellation: { groups } } }}
>
  <article class={ARTICLE_CLASS} set:html={html} />
  <div slot="after">author card, share, related, newsletter</div>
</ArticleLayout>
```

Keeps the `.article-body` contract (article.css, the live editor). 68ch column, TOC rail on
the right (shown when there are 2+ entries). Scene defaults to `documents`; `family` to `blog`.

### ActionLink

`action: { label, href, external? }`, `variant?: "primary" | "ghost"`, `highlight?: number`.
Used by InnerStage and CtaBand; reusable anywhere (readable in both themes).

## Scene config

```ts
interface SceneConfig {
  shapes: ShapeId[]; // 1–3 ids. [0] forms in the stage; others are reached by echo hosts
  data?: { [id]: params }; // arguments for data-driven shapes — real numbers, at build time
  accent?: [hue, hue]; // violet | amber | cyan | fuchsia | sky; defaults to the family pair
  seed?: number; // same seed = same shape on every visit
}
```

Example: `{ shapes: ["terrain"], data: { terrain: { values: featured.map((s) => s.metric) } } }`.
Unknown ids or a bad accent make the scene fall back to its CSS gradient (logged).

**Interacting.** Any element with `data-stage-highlight="2"` lights tag 2 while hovered or
focused; from script, `highlightStage(tag | null)` (`src/scripts/stage3d/events.ts`) — e.g. a
FilterBar category or a completed form step. **Mid-page / closing morph:** any element with
`data-stage-echo` (CtaBand has one) receives the canvas when it scrolls into view with the hero
gone, and re-forms `data-stage-shape="n"` there. Keep mid-page echoes to Vision, Workflows and
Custom model training.

**Budget & fallbacks (automatic).** Half the home tier: ~3.5k points on phones, ~8k on
laptops, DPR ≤ 1.25 phone / 1.5 desktop, no fbm nebula on phones; three.js loads after first
paint and idle; frames run only while the stage is on screen (then on demand); paused when
the tab is hidden; disposed on page unload. Reduced motion → one still frame of the finished
shape. No WebGL 2, Save-Data or ≤ 2 GB memory → the static CSS gradient
(`data-scene="static"`).

## Shape ids

Each sampler is `src/scripts/stage3d/shapes/<file>.ts`, pure, seeded, bounded and 100% tested.
Tags: what `highlight` / `data-stage-highlight` can light. Motion: volumes `spin`, flat
layouts `sway`.

| id                       | params                                               | tags                            | suits                          |
| ------------------------ | ---------------------------------------------------- | ------------------------------- | ------------------------------ |
| `core`                   | —                                                    | 0                               | AI hub (the home core)         |
| `globe`                  | `arcs?: { from: {lat,lon}, to }[]`, `maxArcs?` (24)  | arc i → i+1                     | about, company page, contact   |
| `horizon`                | `horizons?` (3)                                      | arc i → i+1                     | vision                         |
| `lattice`                | `clusters?` (3, ≤ 8)                                 | cluster i → i+1                 | services hub                   |
| `glyph`                  | `paths: [x,y][][]` in [-1,1] (required), `depth?`    | path i → i+1                    | service detail, bot creation   |
| `orbits`                 | `agents?` (6, ≤ 12)                                  | agent i → i+1                   | agentic, job/gig (skill orbit) |
| `tokenStream`            | `tokens?` (14)                                       | 1 in, 2 volume, 3 out           | LLMs                           |
| `layers`                 | `layers?` (5, ≤ 8)                                   | layer i → i+1                   | models                         |
| `converge`               | —                                                    | 1 shape, 2 loss curve, 3 strays | custom model training          |
| `hubSpokes`              | `ports?` (6, ≤ 12)                                   | spoke i → i+1                   | MCP server                     |
| `pipeline`               | `stations?` (5, 2–8), `branchAt?`                    | station i → i+1                 | workflows                      |
| `cubes`                  | `cubes?` (6, ≤ 12)                                   | cube i → i+1                    | our-tools catalogue            |
| `terrain`                | `values: number[]` (required, ≤ 16)                  | bar i → i+1                     | case studies list/detail       |
| `constellation`          | `groups: number[]` (required), `links?: [a,b][]`     | group g → g+1                   | blog list, articles            |
| `figures`                | `figures?` (12, ≤ 40)                                | figure i → i+1                  | careers                        |
| `rings`                  | `rings?` (4, ≤ 8)                                    | ring i → i+1 (innermost first)  | contact, get a quote (beacon)  |
| `shield`                 | —                                                    | 1 outline, 2 face, 3 check      | privacy, cookies, legal        |
| `documents`              | `sheets?` (4, ≤ 8)                                   | sheet i → i+1 (front first)     | policies, grievance, articles  |
| `tree`                   | `branches?: number[]` (pages per section, ≤ 12 × 24) | section i → i+1, root 0         | sitemap                        |
| `jet`, `robot`, `planet` | —                                                    | home-specific                   | (home story worlds)            |

`glyph`, `terrain` and `constellation` throw without their data — pass real numbers.
