# Package reference

The workspace packages under [`packages/`](../../packages). All are `private`, consumed
as TypeScript source, and versioned with the repo — there is no publish step.

---

## `@exyconn/config`

**Path:** `packages/config` · **Runtime dependencies:** none.

The one place a cross-cutting build or style decision lives. Everything here is plain
JSON or plain Node ESM so it can be loaded by Vite, ESLint, Prettier, TypeScript and
Cypress alike.

| Entry point | Used by | What it is |
| --- | --- | --- |
| `@exyconn/config/apps.json` | `shell/config/apps.ts`, `@exyconn/config/vite` | The app registry: subdomain, dev port, page title and description for each micro-frontend. |
| `@exyconn/config/vite` | every app's `vite.config.ts` | `portalViteConfig(appKey)` — React plugin, source aliases, React/MUI/Apollo dedupe, the dev port, the shared `<head>` injector and the Vitest defaults. |
| `@exyconn/config/tsconfig.app.json` | every app's `tsconfig.json` | Compiler options plus the `paths` that resolve `@exyconn/ui`, `@exyconn/shell`, `@exyconn/crud`, `@exyconn/login`, `@exyconn/tabber` and the shell's internal `@/`. |
| `@exyconn/config/eslint` | every `eslint.config.js` | `portalEslintConfig()` — the rule set, including the guard that blocks direct `@mui/*` imports outside `@exyconn/ui` (`muiGuard(uiImport)` is exported for non-portal consumers such as the tracker). |
| `@exyconn/config/prettier.json` | the `"prettier"` field of each `package.json` | Formatting rules. |
| `@exyconn/config/cypress` | every `cypress.config.ts` | Component-testing config and the shared support file. |

An app's whole build configuration is now four short files:

```ts
// vite.config.ts
import { portalViteConfig } from '@exyconn/config/vite';
export default portalViteConfig('crm');
```

```jsonc
// tsconfig.json
{
  "extends": "@exyconn/config/tsconfig.app.json",
  "include": ["src", "__tests__", "vite.config.ts", "../../../packages/shell/src/vite-env.d.ts"],
  "exclude": ["**/*.cy.ts", "**/*.cy.tsx", "cypress"]
}
```

`include` and `exclude` stay per-app on purpose: TypeScript resolves those globs relative
to the file that declares them, so they cannot be inherited.

The per-app `index.html` is a bare mount point; the favicon, description, webfont and
`<title>` are injected from the registry by `portalViteConfig`, so changing the shared
head is a one-line edit in `packages/config/vite.js`.

---

## `@exyconn/ui`

**Path:** `packages/ui` · **Depends on:** `@exyconn/config` (dev only).

The design system, and the **only** package allowed to import `@mui/*` directly — the
ESLint guard blocks it everywhere else. It has no Apollo, router or auth dependency, so
the portals, the tools site and the desktop tracker can all consume it.

| Entry point | What it is |
| --- | --- |
| `@exyconn/ui` | Branded wrappers (`Button`, `IconButton`, `AppBar`, `Drawer`, `TextField`, `Card`, inputs, typography, layout, spacing, tokens) plus every pass-through MUI primitive the apps use, the pickers and the theme. Add a new primitive here first. |
| `@exyconn/ui/styles` | `styled`, `alpha`, `useTheme`, `createTheme`, the raw MUI `ThemeProvider`, `CssBaseline` and the `Theme`/`SxProps`/`CSSObject`/`SystemStyleObject` types. |
| `@exyconn/ui/pickers` | The MUIX date & time pickers and the date-fns adapter, on their own subpath so a bundle without pickers never pulls MUI X. |
| `@exyconn/ui/theme` | `createAppTheme(mode)` and the default `theme` instance. |

Icons stay direct `@mui/icons-material/X` imports. `@exyconn/shell/components/ui` and
`@/components/ui` still resolve as compatibility re-exports of this package.

---

## `@exyconn/shell`

**Path:** `packages/shell` · **Depends on:** `@exyconn/ui`, `@exyconn/config`.

Everything an app renders that is not one of its own screens.

| Area | Path | Notes |
| --- | --- | --- |
| Design system | `src/components/ui` | A compatibility re-export of `@exyconn/ui` (plus the image upload dialog, which needs the shell's Apollo client). |
| Form primitives | `src/components/form` | `EntityForm`, `useEntitySave`, `FormActions` and the `Rhf*` field set (React Hook Form + Zod). |
| Data components | `src/components/data` | `ServerDataGrid` (lazily-loaded ag-grid), `DataTable`, `CrudDialog`, `StatusChip`, `BoolChip`, `tableStats`. |
| Dashboard | `src/components/dashboard` | `ModuleDashboard`, `StatCard`. |
| Feedback | `src/components/feedback` | `useConfirm`, `useNotify` — the MUI dialogs that replace native `alert`/`confirm`. |
| App frame | `src/app`, `src/layout` | `PortalApp` (providers + routing + auth gate), `mountPortalApp`, sidebar/topbar. |
| Auth | `src/auth` | Roles, JWT cookie store, `useAuth`. |
| GraphQL | `src/graphql` | `.graphql` operations and the committed codegen output. |
| Config | `src/config` | Apollo client, the app registry re-export and the module/navigation model (the theme lives in `@exyconn/ui/theme`). |
| Shared pages | `src/pages` | Profile, Settings, User details, the tracker view and the user forms every module reuses. |

### Forms

Every module form uses the same two pieces:

```tsx
const methods = useForm<z.input<typeof schema>, unknown, Values>({
  resolver: zodResolver(schema),
  defaultValues: toInitial(initial),
});

const { isEdit, onSubmit } = useEntitySave({
  label: 'Lead',
  initial,
  create: (values: Values) => createLead({ variables: { input: values } }),
  update: (row, values) => updateLead({ variables: { id: row.id, input: values } }),
  onDone,
});

return (
  <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
    <RhfTextField name="name" label="Name" />
  </EntityForm>
);
```

`useEntitySave` picks create or update from whether a row is being edited, reports the
outcome through the shared notifier (`"Lead created"` / the error's own message) and
calls `onDone`. `EntityForm` renders the form context, the `<form>` with native
validation off, the field stack and the Cancel/Save footer.

A form that is not a create-or-update — sending a contract, marking attendance — keeps
its own submit handler and still uses `EntityForm` for the frame.

---

## `@exyconn/crud`

**Path:** `packages/crud` · **Depends on:** `@exyconn/shell`.

The server-paged CRUD kit. See [crud-kit.md](./crud-kit.md).

---

## `@exyconn/login`

**Path:** `packages/login` · **Depends on:** `@exyconn/shell`.

The login screen. Every app passes it to `PortalApp` as `loginElement`, so an expired
session on any subdomain lands on the same screen and the JWT cookie is shared across
`.exyconn.com`.
