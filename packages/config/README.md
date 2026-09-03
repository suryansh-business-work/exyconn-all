# `@exyconn/config`

The portal's app registry plus the build, lint, format and test presets every portal
package extends. No runtime dependencies — everything here is plain JSON or plain Node
ESM so Vite, ESLint, Prettier, TypeScript and Cypress can all load it.

```ts
import { portalViteConfig } from '@exyconn/config/vite';
export default portalViteConfig('crm');
```

- `apps.json` — the single source of truth for each micro-frontend's subdomain, dev port,
  page title and description.
- `vite.js` — `portalViteConfig(appKey)`: source aliases, dedupe, dev port, the shared
  `<head>` injector and the Vitest defaults.
- `tsconfig.app.json`, `eslint.js`, `prettier.json`, `cypress.js`, `vitest.setup.ts`.

Full reference: [docs/portal/packages.md](../../docs/portal/packages.md#exyconnconfig).
Adding an app: [docs/portal/adding-a-module.md](../../docs/portal/adding-a-module.md).
