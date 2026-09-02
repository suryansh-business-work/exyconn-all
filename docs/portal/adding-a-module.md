# Recipes

## Add a CRUD screen to an existing app

The server side first — the shared grid only works against a `listXxxPaged` +
`listXxxStats` pair.

1. **Server:** add `listXxxPaged(input: TableQueryInput!)` and `listXxxStats` resolvers
   alongside the entity's create/update/delete mutations.
2. **Operations:** add the documents to
   `packages/shell/src/graphql/operations/<module>.graphql`, then `pnpm codegen` and
   commit the generated output — CI fails if it drifts.
3. **Column model** — `<entity>-grid.tsx` next to the page:

   ```tsx
   export type PagedThingRow = ListThingsPagedQuery['listThingsPaged']['rows'][number];
   export type ThingsGridContext = CrudGridContext<PagedThingRow>;

   export const THING_COLUMNS: ColDef<PagedThingRow>[] = [
     textColumn('name', 'Name'),
     statusColumn('status', 'Status'),
     actionsColumn(),
   ];
   ```

   Use `DatedCrudGridContext` and add `formatDate` to the context if any column is a
   `dateColumn`. Reach for a hand-written `cellRenderer` only for something genuinely
   one-off (a link, a chip list) — see `tools-grid.tsx` or `prompts-grid.tsx`.

4. **Form** — a folder named after the form with the four files rule 10 of
   [CLAUDE.md](../../.claude/CLAUDE.md) requires (`.form.tsx`, `.form.cy.tsx`,
   `.types.tsx`, `index.tsx`), built on `useEntitySave` + `EntityForm`
   ([packages.md](./packages.md#forms)).
5. **Page** — `useCrudResource` + `usePagedFetcher` + `CrudDashboard`. Copy
   `apps/crm/src/pages/crm/CrmPage.tsx`; it is the smallest complete example.
6. **Route** — add a `<Route>` to the app's `src/App.tsx`, and a `children` entry under
   the module in `packages/shell/src/config/modules.ts` so it appears in the sidebar.
7. **Verify** — `pnpm --filter <app> run typecheck lint test build`.

## Add a whole micro-frontend

1. **Register the app** in [`packages/config/apps.json`](../../packages/config/apps.json)
   with a free subdomain, a free port (the block is 4020+), a `<title>` and a description.
   The registry test enforces uniqueness.
2. **Role** — add it to `packages/shell/src/auth/roles.ts` and to the server's role enum.
3. **Module entry** — add it to `packages/shell/src/config/modules.ts` (`key` must equal
   the registry key; that is what makes cross-app links resolve).
4. **Scaffold `exyconn-portal/apps/<key>/`** — copy `apps/crm` and keep these files:

   ```
   package.json          name @exyconn/portal-app-<key>, prettier: "@exyconn/config/prettier.json"
   tsconfig.json         extends @exyconn/config/tsconfig.app.json
   vite.config.ts        export default portalViteConfig('<key>')
   .eslintrc.cjs         portalEslintConfig({ uiImport: '@exyconn/shell/components/ui' })
   cypress.config.ts     defineConfig(portalCypressConfig())
   index.html            the bare mount point — the head comes from the registry
   src/main.tsx          mountPortalApp(<App />)
   src/App.tsx           <PortalApp loginElement={<Login />} moduleRole={…} homePath="/…">
   ```

   Depend on `@exyconn/shell`, `@exyconn/login` and — if it has a CRUD screen —
   `@exyconn/crud`; keep `@exyconn/config` in `devDependencies`.
5. **Deployment** — these three still mirror the registry by hand:
   - `docker/portal-app.Dockerfile` — a `COPY .../package.json` line in the deps layer.
   - `.github/workflows/deploy.yml` — a `matrix.include` entry with `APP_PKG`, `APP_DIR`,
     `PORT`, `VITE_PORTAL_APP`.
   - `docker-compose.prod.yml` — the service and its `127.0.0.1:<port>:<port>` binding,
     plus the new origin in the server's `CORS_ORIGIN`.
   - `deploy/nginx` — the subdomain's server block and certificate.
6. **Verify** — `pnpm install`, then `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## Change something shared

| Change | Where |
| --- | --- |
| A page's `<title>`, description, port or subdomain | `packages/config/apps.json` |
| The favicon or webfont every app loads | `packages/config/vite.js` (`portalHtml`) |
| A TypeScript compiler option or path alias | `packages/config/tsconfig.app.json` |
| An ESLint rule | `packages/config/eslint.cjs` |
| Formatting | `packages/config/prettier.json` |
| A UI primitive's defaults | `packages/shell/src/components/ui` |
| The Cancel/Save footer or field spacing on every form | `packages/shell/src/components/form` |
| How a status chip, date cell or row action renders in every grid | `packages/crud/src/grid` |
| The CRUD screen's layout | `packages/crud/src/page/CrudDashboard.tsx` |

## Branching

Feature branch → `staging` → PR into `main`. A husky pre-push hook blocks pushing to
`main` directly. See rule 32 of [CLAUDE.md](../../.claude/CLAUDE.md).
