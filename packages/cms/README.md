# @exyconn/cms

The website CMS's shared model (zero runtime dependencies):

- `CmsBlock` / `CmsCompiled` — the block tree a page or fragment compiles to.
- `compileHtml(html, css)` — GrapesJS HTML → blocks. Server-rendered sections are
  `<exy-component data-key data-props>` placeholders (they nest: a container's children are its
  slot); reusable fragments are `<exy-fragment data-fragment-id>`.
- `componentPlaceholder`, `fragmentPlaceholder`, `fragmentIdsOf` — helpers for the seed, the
  editor and the renderer.
- `CMS_COMPONENTS` / `cmsComponent(key)` — the catalogue of dynamic components (data only); the
  website maps each key to its Astro component in `src/components/cms/registry.ts`, typed against
  `CmsComponentKey` (the union of every key) so the two cannot disagree.

Moving a page of exyconn.com into the CMS: see [MIGRATION.md](./MIGRATION.md).

Consumed from source by the website and the portal apps, and through the compiled `dist` (the
`require` condition) by the portal server — build it with `pnpm --filter @exyconn/cms build`.
