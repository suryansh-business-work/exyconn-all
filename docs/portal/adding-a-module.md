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
2. **Role** — usually a new one, added to `packages/shell/src/auth/roles.ts` AND the
   server's `src/constants/roles.ts` AND the `Role` enum in `admin.typeDefs.ts`. An app
   every colleague should reach reuses `EMPLOYEE` instead and skips all three (Social
   does this); two modules may share a role, since `accessibleModules` filters by
   membership and `APP_BY_SEGMENT` routes on the first path segment.
3. **Module entry** — add it to `packages/shell/src/config/modules.ts` (`key` must equal
   the registry key; that is what makes cross-app links resolve).
4. **Scaffold `exyconn-portal/apps/<key>/`** — copy `apps/crm` and keep these files:

   ```
   package.json          name @exyconn/portal-app-<key>, prettier: "@exyconn/config/prettier.json"
   tsconfig.json         extends @exyconn/config/tsconfig.app.json
   vite.config.ts        export default portalViteConfig('<key>')
   eslint.config.js      export default portalEslintConfig()
   cypress.config.ts     defineConfig(portalCypressConfig())
   index.html            the bare mount point — the head comes from the registry
   src/main.tsx          mountPortalApp(<App />)
   src/App.tsx           <PortalApp loginElement={<Login />} moduleRole={…} homePath="/…">
   ```

   Depend on `@exyconn/shell`, `@exyconn/login` and — if it has a CRUD screen —
   `@exyconn/crud`; keep `@exyconn/config` in `devDependencies`.
5. **Deployment** — seven places still mirror the registry by hand. Miss one and the
   failure is usually far from the cause, so the list is worth working through in order:
   - `docker/portal-app.Dockerfile` — a `COPY .../package.json` line in the deps layer.
     Without it pnpm resolves nothing for the filter and the build dies on `tsc: not
     found` twenty minutes into a deploy. `scripts/check-docker-manifests.mjs` catches it
     in seconds; run it.
   - `.github/workflows/deploy.yml` — a `matrix.include` entry with `APP_PKG`, `APP_DIR`,
     `PORT`, `VITE_PORTAL_APP`, **and** the domain in the post-deploy health-check list.
   - `docker-compose.prod.yml` — the service and its `127.0.0.1:<port>:<port>` binding,
     plus the new origin in the server's `CORS_ORIGIN`. Forgetting the origin gives you an
     app that loads and then fails every query in the browser, with nothing in the logs.
   - `deploy/nginx/portal-apps.exyconn.com.conf` — the subdomain's server block.
   - `deploy/server-setup.sh` — the `DOMAINS` list, so certbot issues the certificate.
   - `.github/workflows/provision-nginx.yml` — its own URL list; this is the workflow you
     dispatch once, after the DNS record exists, to install the vhost and issue the cert.
   - `docs/portal/portals.md` and `DEPLOYMENT.md` — the port/domain/image tables.

   Order matters at the end: deploy.yml health-checks the new domain, so the certificate
   has to exist *before* the first deploy or the job fails on a domain with no TLS.
6. **Verify** — `pnpm install`, then `pnpm typecheck && pnpm lint && pnpm test && pnpm build`,
   plus `node scripts/check-docker-manifests.mjs` and `node scripts/check-workspace-imports.mjs`.

## Change something shared

| Change | Where |
| --- | --- |
| A page's `<title>`, description, port or subdomain | `packages/config/apps.json` |
| The favicon or webfont every app loads | `packages/config/vite.js` (`portalHtml`) |
| A TypeScript compiler option or path alias | `packages/config/tsconfig.app.json` |
| An ESLint rule | `packages/config/eslint.js` |
| Formatting | `packages/config/prettier.json` |
| A UI primitive's defaults | `packages/shell/src/components/ui` |
| The Cancel/Save footer or field spacing on every form | `packages/shell/src/components/form` |
| How a status chip, date cell or row action renders in every grid | `packages/crud/src/grid` |
| The CRUD screen's layout | `packages/crud/src/page/CrudDashboard.tsx` |

## Branching

Feature branch → `staging` → PR into `main`. A husky pre-push hook blocks pushing to
`main` directly. See rule 32 of [CLAUDE.md](../../.claude/CLAUDE.md).
