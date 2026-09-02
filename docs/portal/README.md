# Exyconn Portal — architecture

The portal is a set of **micro-frontends**: one Vite build per module, each served from
its own subdomain (`admin.exyconn.com`, `crm.exyconn.com`, …) and all talking to the
single portal GraphQL server. A module app owns only what makes it different — its
routes, its screens and its GraphQL documents. Everything else comes from four shared
workspace packages.

```
                         ┌───────────────────────────────┐
                         │  @exyconn/config              │  build + registry
                         │  apps.json · vite · eslint    │  (no runtime deps)
                         │  prettier · tsconfig · cypress│
                         └───────────────┬───────────────┘
                                         │
                         ┌───────────────▼───────────────┐
                         │  @exyconn/shell               │  design system, auth,
                         │  ui · auth · graphql · layout │  Apollo, layout, forms,
                         │  forms · hooks · shared pages │  generated GraphQL hooks
                         └───────┬───────────────┬───────┘
                                 │               │
                 ┌───────────────▼──┐      ┌─────▼─────────────┐
                 │  @exyconn/crud   │      │  @exyconn/login   │
                 │  grid columns    │      │  login screen     │
                 │  paged fetcher   │      └─────┬─────────────┘
                 │  CRUD dashboard  │            │
                 └───────┬──────────┘            │
                         │                       │
        ┌────────────────▼───────────────────────▼────────────────┐
        │  exyconn-portal/apps/*   +   exyconn-portal/ui (hub)    │
        │  routes · pages · column models · forms                 │
        └─────────────────────────────────────────────────────────┘
```

Dependencies only ever point **downwards**: apps depend on `crud`, `login` and `shell`;
`crud` and `login` depend on `shell`; `shell` reads the app registry out of `config`.
Nothing depends on an app.

## The packages

| Package | What it is | Docs |
| --- | --- | --- |
| [`@exyconn/config`](../../packages/config) | The app registry (`apps.json`) plus the Vite, TypeScript, ESLint, Prettier and Cypress presets every package extends. Zero runtime dependencies. | [packages.md](./packages.md#exyconnconfig) |
| [`@exyconn/shell`](../../packages/shell) | The design system, auth, Apollo wiring, portal layout, form primitives, generated GraphQL hooks and the pages every module shares (Profile, Settings, User details). | [packages.md](./packages.md#exyconnshell) |
| [`@exyconn/crud`](../../packages/crud) | The server-paged CRUD kit: ag-grid column factories, the paged fetcher, the create/edit/delete resource hook and the dashboard that composes them. | [crud-kit.md](./crud-kit.md) |
| [`@exyconn/login`](../../packages/login) | The login screen, shared by every app so an expired session lands in the same place. | [packages.md](./packages.md#exyconnlogin) |

The packages are consumed **as TypeScript source**, not as built artifacts: each app's
Vite config aliases `@exyconn/shell/...` and `@exyconn/crud/...` straight at `src/`, and
`dedupe` keeps React, MUI and Apollo as single instances. There is no package build step
and no watch mode to remember.

## The app registry

[`packages/config/apps.json`](../../packages/config/apps.json) is the single source of
truth for every micro-frontend: its subdomain, its dev port, and the `<title>` and
description its page ships. Three consumers read it:

- **`portalViteConfig(app)`** — picks the dev port and injects the shared `<head>`.
- **`@exyconn/shell/config/apps`** — resolves cross-app links (`appUrl`, `appOrigin`).
- **`docker-compose.prod.yml` and `.github/workflows/deploy.yml`** — mirror the ports and
  subdomains per service. These are not generated; when you add an app, update them too
  (see [adding-a-module.md](./adding-a-module.md)).

`packages/shell/__tests__/unit-tests/apps.test.ts` guards the registry's invariants —
unique ports, unique subdomains, and a registered app behind every navigable module.

## Day-to-day

```bash
pnpm install                              # one install for the whole workspace
pnpm --filter @exyconn/portal-app-crm dev # one module app on its registry port
pnpm dev                                  # server + hub + website together

pnpm typecheck && pnpm lint && pnpm test  # what CI runs
pnpm codegen                              # regenerate GraphQL hooks after a .graphql edit
```

`pnpm codegen` output is committed and CI fails if it drifts. Do not run Prettier over
`exyconn-portal/server` — it reformats the generated GraphQL and trips that gate.

## Further reading

- [packages.md](./packages.md) — what lives in each package and what it exports.
- [crud-kit.md](./crud-kit.md) — the CRUD kit, with a full worked module.
- [adding-a-module.md](./adding-a-module.md) — adding a screen, and adding a whole app.
