Do not create a branch change only staging only

# Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

## Tech Stack:
Portals (exyconn-portal/apps/*, packages/shell, packages/ui) and the desktop tracker (exyconn-tracker-app, Electron): MUI (Material UI)
Phone tracker (exyconn-tracker-mobile, Expo): Tamagui
Website (exyconn-website): Astro (Highest Priority)

## Forms & Validation:
React Hook Form + Zod for form handling and validation.

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.
2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# Follow beloe as well these strict coding guidelines for the project

1. File Size Limit:
   - No file should exceed 200 lines of code for tsx file
   - If logic grows, split into smaller reusable modules/components.

2. Dynamic Data:
   - Do NOT hardcode static data.
   - All data must come from APIs, configs, environment variables, or dynamic sources.
   - Use constants only for reusable configuration, not business data.

3. Form Validation:
   - Use Zod (with React Hook Form) for all form validations. Yup and Formik are not used in this repo.
   - Ensure proper schema-based validation.
   - Cover:
     - Required fields
     - Type validation (string, number, email, etc.)
     - Min/Max constraints
     - Custom validation where needed

4. Code Quality:
   - Write clean, modular, and reusable code.
   - Use proper naming conventions.
   - Avoid duplication (DRY principle).

5. Error Handling:
   - Handle all API and validation errors properly.
   - Show meaningful error messages to users.

6. Scalability:
   - Keep components small and maintainable.
   - Follow separation of concerns.

7. Best Practices:
   - Use async/await for API calls.
   - Use environment variables for configs.
   - Maintain consistent folder structure.

8. Check linting, build, and formatting, then push the code. Ensure that all GitHub CI checks are green and that everything is up and running:
<https://exyconn.com>
<https://portal-server.exyconn.com/health>
<https://portal.exyconn.com>
<https://admin.exyconn.com>
<https://employee.exyconn.com>
<https://hr.exyconn.com>
<https://finance.exyconn.com>
<https://support.exyconn.com>
<https://crm.exyconn.com>
<https://products.exyconn.com>
<https://legal.exyconn.com>
<https://tech.exyconn.com>
<https://it.exyconn.com>
<https://compliance.exyconn.com>
<https://social.exyconn.com>
<https://status.exyconn.com>
<https://marketing.exyconn.com>
<https://projects.exyconn.com>
<https://ai.exyconn.com>
<https://website.exyconn.com>
<https://tracker.exyconn.com>
<https://tools.exyconn.com>
<https://tools-api.exyconn.com/health>

9. Any .tsx file should not exceed 200 lines. If a file grows beyond 200 lines, create a folder with the same component name and refactor it into multiple smaller components/modules inside that folder using an index-based structure. Ensure the refactor introduces no breaking changes and preserves all existing functionality, imports, exports, and behavior.

10. Before creating any form, first create a dedicated folder with the form name. Inside it, keep these 4 files: (form-name).form.tsx for the form implementation using React hook form + Zod with proper hints, validations, and error handling, (form-name).form.cy.tsx for Cypress test cases covering validations and user flows, (form-name).types.tsx for codegen-based shared/common types, and index.tsx to export all required components, types, and utilities from a single entry point. This applies to every portal app and to packages/shell. Strictly use MUI only, no raw HTML form components; for date and time use MUI X date and time pickers. The portals and both tracker apps use React Hook Form + Zod; nothing here uses Formik or Yup.

11. For Date and time use Data FNS and make sure it should be sync based on setting in admin panel. For date and time input use MUIX Core date and time pickers. Always ensure that the date and time are displayed in the user's local timezone and format, which can be configured in the admin panel. Avoid hardcoding any date or time formats; instead, use dynamic formatting based on user settings.

12. No Alert box, Confirm box and Prompt box html/JS Code Use MUI Confirmation/ Alert Only

13. Use GraphQL and GraphQL Code Generator for all API interactions. Ensure that all queries and mutations are properly typed and that the generated code is used throughout the project for type safety and consistency.

14. After completing all changes, make sure to verify the build, check types, run lint checks, apply code formatting, and only then push the code to the repository. Ensure that all GitHub CI checks pass successfully and that the application is fully functional across every domain listed under rule 8 (the deploy workflow's verify job checks the same list).

15. Performance, Security, Accessbility, SEO, Best Practices, Code Quality, Scalability, and Maintainability should be the top priority while writing code. Always follow industry best practices and guidelines to ensure that the codebase remains robust, secure, and maintainable in the long run. Regularly review and refactor code to improve performance, enhance security, and ensure accessibility compliance.

16. Don't overengineer: Simple beats complex
17. No fallbacks: One correct path, no alternatives
18. Separation of concerns: Each function should have a single responsibility
19. Proper Error Handling and Logging: Always handle errors gracefully and log them appropriately for debugging and monitoring purposes.
20. Consistent Code Style: Follow a consistent code style and formatting guidelines to improve readability and maintainability across the codebase.
21. Regular Code Reviews: Conduct regular code reviews to ensure code quality, share knowledge, and maintain coding standards across the team.
22. Write Tests: Ensure that all new features and critical code paths are covered by unit tests, integration tests, and end-to-end tests to maintain code quality and prevent regressions.
23. Documentation: Document your code, especially complex logic and public APIs, to improve maintainability and help other developers understand the codebase quickly.
24. Use TypeScript: Leverage TypeScript for type safety and improved developer experience. Ensure that all code is properly typed and that type definitions are maintained and updated as needed.
25. All test-related files under the __tests__ directory and organize them into separate e2e and unit-tests folders. All existing tests should be moved into their respective folders accordingly.

26. Code-quality rules (SonarQube clean-code). Write code that does NOT trip these — they are enforced by SonarQube on every push.

26a. React / TSX —

- Mark component props read-only: type the props parameter as `Readonly<Props>` (or `({ a, b }: Readonly<{ a: string }>)` for inline types). (S6759)
- Never use an array index as a React `key`; use a stable unique id from the item. Always provide a `key` for elements rendered in an array/`.map`. (S6479, S6477)
- Do not define a component inside another component; hoist it to module scope and pass data via props. (S6478)
- Only use ARIA attributes valid for the element's role (e.g. `aria-selected` needs role `tab`/`option`, not `button`). (S6811)
- Remove unused PropTypes and unused imports. (S6767, S1128)

26b. Conditionals & expressions —

- No nested ternaries: extract the inner ternary into a named `const` or an `if/else` above the expression. (S3358)
- No negated condition with an `else`: write `if (x) { B } else { A }` instead of `if (!x) { A } else { B }`. (S7735)
- Prefer optional chaining `a?.b?.c` over `a && a.b && a.b.c` (only when operands are object-nullables, not 0/""/false). (S6582)
- Prefer nullish coalescing: `a ?? b` instead of `a != null ? a : b` or `a ? a : b`. (S6606, S6644)
- Add `{ }` braces around multi-line `if`/`for` bodies — never rely on a single unbraced statement. (S2681)
- A conditional whose branches return the same value is a bug — make the branches differ or remove the condition. (S3923)

26c. Functions & complexity —

- Keep Cognitive Complexity ≤ 15: extract cohesive blocks into well-named helpers and use early-return guard clauses. (S3776)
- Do not nest functions more than 4 levels deep; extract inner functions to a higher scope. (S2004)

26d. Strings, numbers, modules (Node/TS) —

- Import Node builtins with the `node:` protocol: `from 'node:crypto'`, `require('node:fs')`. (S7772)
- Use `Number.parseInt` / `Number.parseFloat`, not the bare globals. (S7773)
- Use `str.startsWith(x)` / `str.endsWith(x)` instead of `indexOf(x) === 0` / `slice`/`lastIndexOf` checks. (S6557)
- Use `String.raw` for strings full of backslashes; never nest template literals (hoist the inner template to a const). (S7780, S4624)
- Use `replaceAll` only when a global replace is intended (`replace('x', y)` replaces only the first match). (S7781)
- Pass `String` directly to `.map(String)` instead of `x => String(x)`. (S7770)
- Prefer `globalThis` over `window` for truly-global access (keep `window` only for DOM-only APIs). (S7764)
- Batch `Array#push`: `a.push(x, y)` instead of consecutive `a.push(x); a.push(y);`. (S7778)
- Use a hoisted `Set` + `.has()` instead of `array.includes()` for membership lookups on constant lists. (S7776)
- Do not stringify objects that fall back to `[object Object]` — stringify a field or `JSON.stringify`. (S6551)
- `arr.sort()` mutates: use `arr.toSorted()` when you only need a sorted copy in an expression. A `sort` used purely for in-place mutation inside an arrow must be a statement body (`(l) => { l.sort(); }`), not an expression body. (S4043)
- For a single (non-global) match use `re.exec(str)`, not `str.match(re)`. (S6594)
- Prefer `String#codePointAt()` over `charCodeAt()` (handle the `number | undefined` result, e.g. `?? 0`). Only swap when full code points are intended (binary `atob` bytes are 0–255, so it's safe). (S7758)
- Don't spread a useless empty object: `{ ...(obj || {}) }` → `{ ...obj }` (spreading `null`/`undefined`/primitives in an object literal is already a no-op). (S7744)
- In ESM modules / `.mjs` scripts, prefer top-level `await` over a `main().then().catch().finally()` chain — wrap in `try/catch/finally` to keep the same error handling. (S7785)

26e. Types & fire-and-forget —

- Do not leave a useless `void` operator: a fire-and-forget promise must use `promise().catch((e) => log(e))` (never silently drop errors); `void 0` → `undefined`. (S3735)
- Remove type assertions (`as X`, non-null `!`) that don't change the type. (S4325)
- Mark class members that are never reassigned as `readonly`. (S2933)
- Extract a repeated union into a `type X = A | B` alias. (S4323)

26f. Security (NEVER hard-code) —

- No hard-coded passwords / secrets / credentials in source — read them from environment variables / config (`process.env`). This includes test credentials. (S2068)

26g. Refactoring to cut Cognitive Complexity (S3776) — keep behavior AND coverage identical —

- Prefer extracting a cohesive JSX block into a __hoisted, module-scope sub-component__ (e.g. a card/button/list) or a long branch into a named helper with early-return guards. Never define the component inside the parent (S6478). Mark every extracted prop type `Readonly<…>` (S6759).
- A deeply-nested ternary chain (`a ? : b ? : c ? : d`) costs more than the same logic as a sub-component using `if`/early-returns — pull the leaf branches out, or move a single inline `?:` into a top-level `const` so it sits at nesting 0.
- For a flagged value used in a JSX prop (e.g. `onDownloadTicket={podId ? … : undefined}`), hoist it to a `const` above the `return` — that drops its nesting increment without changing behavior.
- DO NOT duplicate a shared conditional value (like `const ink = mine ? '$onPrimary' : '$color'`) into multiple conditionally-rendered children: in a 100%-coverage package (exyconn-tracker-mobile, threshold 100/100/100/100) that creates a new branch that only executes in the child's render path, so a test that exercises the value on only one side leaves it uncovered. Compute it __once in the parent__ and pass it as a prop (extract the repeated union into a `type` alias, S4323).
- After any tracker refactor run that package's `typecheck`, `lint` (zero-warning gate) AND `test` with coverage — a green typecheck is not enough; the branch threshold catches coverage regressions from extracted components.

27. Most important point: the desktop tracker (exyconn-tracker-app) and the phone tracker (exyconn-tracker-mobile) must behave identically. Everything not tied to a platform lives in packages/tracker-core and is shared by both.
28. Do not create MJML files locally. Email templates are records seeded by the server (`ensureEmailDefaults`) and edited in the portal; maintain them there.
29. Use MUI (via @exyconn/ui) for portal and desktop-tracker components; the phone tracker uses Tamagui components.
30. Portals, desktop tracker and phone tracker all use React Hook Form and Zod.
31. No UTF icons. Phone tracker icons come from @expo/vector-icons; portals and the desktop tracker use @mui/icons-material.
32. Branching & deployment flow: two long-lived branches only. Every change is pushed to `staging` (never a feature branch, never `main`); `ci.yml` runs on it and `build.yml` sends it to SonarQube. There is no staging deployment. When CI is green, open a PR `staging` -> `main`; merging runs `deploy.yml`, which tests again, builds every image, rolls the server at /opt/exyconn and health-checks every domain in rule 8.
33. Tracker versioning (ENFORCED): one version lives in exyconn-tracker-app/package.json and is mirrored into exyconn-tracker-mobile/package.json by scripts/bump-version.mjs; CI's `check-tracker-versions.mjs` fails the run if they drift. The `.githooks/pre-commit` hook asks major/minor/patch on every commit (interactive via /dev/tty, else $VERSION_BUMP, else patch; `s` skips; rebases and merges are not bumped) and stages the bump into the commit. The root package version describes the repository, not a shipped artifact, and is not bumped. Tracker binaries are built only by `tracker-release.yml` (on a push to `main` touching the tracker, or from Tech > Tracker Build), which tags the release `tracker-v<version>`; electron-updater compares against that number, so a release without a bump is one no installed tracker will notice.
34. No Duplicate Code Deep think on the same use common module generic jo multiple place me use ho sake, Create Common Utils, Common Packages, Shared File etc
35. SonarQube Coding Standards — write clean the first time

When writing or editing TS/TSX/JS/CSS in this repo, follow these. They map to the
Sonar rules that keep failing here (rule id in brackets). **Get them right up front — there is no eslint autofix to save you.**

### Globals, imports & modern APIs
- Use `globalThis`, never `window`/`self`/`global`, for universal globals (`setTimeout`, `fetch`, `structuredClone`, `crypto`). Keep `window.document` / `window.location` / DOM-only APIs as-is. [S7764]
- Node/NestJS builtins import with the `node:` protocol: `import fs from 'node:fs'`, `'node:path'`, `'node:crypto'`. (Not in Vite/Metro-bundled client code.) [S7772]
- `Number.parseInt` / `Number.parseFloat` (keep the radix), not the bare globals. **Do NOT** swap `isNaN`→`Number.isNaN` — different behavior. [S7773]
- `Date.now()` not `new Date().getTime()`. `Object.hasOwn(o, k)` not `hasOwnProperty.call`. [S7719, S6653]

### Types & assertions (strict mode)
- No redundant `as T` casts or trailing `!` when the type already fits — let inference work. [S4325]
- Never put `any` in a union (`string | any` → just `any` or, better, a real type). [S6571]
- Optional members: `foo?: string`, not `foo?: string | undefined`. [S4623]
- Repeated unions → a named `type` alias. [S4323]

### Control flow & readability
- **No nested ternaries** — this is the #1 issue (236×). Extract to a variable, `if/else`, early return, or a lookup map. In JSX, compute above `return`. [S3358]
- No negated condition when there's an `else` — lead with the positive case: `if (ok) {…} else {…}`. [S7735]
- Optional chaining `a?.b` over `a && a.b` (but check for meaningful falsy `0/''/false` first). [S6582]
- No nested template literals — extract the inner one to a variable. [S4624]
- `else if (x)` not `else { if (x) {…} }`. Use `<=` not `!(a > b)`. [S6660, S1940]

### Strings & regex
- Regex shorthands: `\d` `\D` `\w` `\s`, not `[0-9]` etc. [S6353]
- `String.raw`\`C:\dir\` for literals with backslashes (paths, regex sources). [S7780]
- `str.replaceAll(...)` not `str.replace(/g/)`. `codePointAt()` not `charCodeAt()`. [S7781, S7758]

### React / TSX
- **Stable `key` props** on every list item — use `item.id`, never the array index; never omit it. [S6477, S6479]
- Don't define a component inside another component — hoist to module scope, pass data via props. [S6478]
- Context `value` object → wrap in `useMemo` so it doesn't change every render. [S6481]
- Destructure `useState` symmetrically: `const [count, setCount] = useState(0)`. Mark props read-only: `Readonly<Props>`. [S6754, S6759]

### Complexity — keep functions small
- Cognitive complexity ≤ 15: extract cohesive blocks into named helpers, use early-return guard clauses, avoid deep nesting (functions ≤ 4 levels deep). [S3776, S2004]

### Correctness & safety (highest priority)
- **Never use the `void` operator.** For a floating promise use `await` or `.catch(err => …)` — don't hide it. [S3735]
- `Array.prototype.sort()` **always takes a comparator**: `(a,b) => a-b` for numbers, `(a,b) => a.localeCompare(b)` for strings. Use `toSorted()` if the source must not mutate. [S2871]
- **No hardcoded secrets or IPs** — passwords, tokens, IP addresses come from env/config, never literals. [S2068, S1313]
- Every test needs a real assertion (`expect(...)`); for async use `await expect(fn()).rejects.toThrow()`. [S2699]
- Don't stringify raw objects (`` `${obj}` `` → `[object Object]`) — use `JSON.stringify` or a specific field. [S6551]
- Don't leave both branches of an `if`/ternary identical, dead assignments, empty functions, or commented-out code blocks. [S3923, S1854, S1186, S125]

### Accessibility (web portals only)
- Clickable elements = real `<button>`/`<a>`. If you must use a `<div>`, add `role`, `tabIndex={0}`, and an `onKeyDown` (Enter/Space) alongside `onClick`. [S1082, S6848]
- Every form control has an associated `<label>` with text. Don't disable zoom (`user-scalable=no`). Ensure ≥4.5:1 text contrast. [S6853, S7926, S7924]

### Before you finish
- Typecheck the workspace you touched (`pnpm --filter <name> exec tsc -b --noEmit`, or `tsc --noEmit -p tsconfig.json` for server) and run its tests. Don't introduce a new Sonar issue to fix an old one.
- Generated code (`**/graphql/generated/**`) is committed exactly as codegen emits it — never format it, and always run the ROOT `pnpm codegen` (it regenerates server, shell and tracker-core together).

36. Exyconn operating rules (adapted 2026-10-03). Where these overlap a rule above, the stricter one wins; the conflicts are settled here explicitly.

### Testing — temporarily paused (overrides rules 4, 22, 25, 26g and "Before you finish" until lifted)
- Do not write new unit, integration, Cypress or E2E tests, and do not run them locally. Focus on feature work.
- A failing test is not a reason to stop feature work. Still run typecheck, lint, format and build.
- Once lifted: no dummy or coverage-only tests. Each test checks real behaviour (success, failure, validation, boundary and edge cases), runs the same way every time, and has a real assertion. Overall coverage stays above 85%. The phone tracker keeps its 100% gate.

### System safety
- Before and during heavy work (builds, codegen, Docker, Cypress), watch CPU temperature and load, RAM and free disk. If any gets close to critical, pause, wait for it to settle, then carry on from the same step without asking the user to type "continue". See the memory note on CI `--parallel` OOM. Locally, use `--workspace-concurrency` rather than `--parallel` too.

### Push, PR and CI (rules 8, 14 and 32 still apply)
- Push only when the user asks for it on the current task. When you push, it goes to `staging` only. Never push to `main` or create another branch.
- After a push, open or update the PR `staging` → `main`. Watch every check (CI, build, SonarQube, lint, security) until it is green. If one fails, find the root cause, fix it on `staging`, push and watch again. The work is not done while a check is red or pending.
- Keep unrelated tasks in separate commits with task-specific messages.
- Never deploy to production or merge to `main` unless the user explicitly asks.

### SonarQube quality gate (rule 35 lists the rules)
- The gate must pass, with no Blocker, High, Medium or Low actionable issues in Security, Reliability or Maintainability. Never suppress or disable a valid rule to get there. If analysis needs a token, ask the user for it instead of skipping the check.

### Error boundaries
- Every portal page, desktop tracker screen and phone tracker screen sits behind an error boundary. One page failing must never take down the app.
- Use the existing pieces: `LogErrorBoundary` (`@exyconn/logger/react`) as the base, `PageErrorBoundary` (`packages/shell/src/logging`) for portals, and `RootErrorBoundary`/`ScreenErrorBoundary` (`exyconn-tracker-mobile/src/components/shell`) on the phone. Do not write new boundaries.
- Each fallback offers **Retry** and **Report an issue**. Errors go to Tech > Logs through `@exyconn/logger` with useful debugging context and no personal data, tokens or form values.

### Search, reuse, extend
- Search the whole relevant codebase before you write anything. Reuse existing functions, hooks, components, services, types and packages. Extend what exists before adding a file or a parallel solution.
- Logic used in more than two places belongs in an `@exyconn/*` package (`packages/*`). Framework-free logic shared by desktop and phone goes in `@exyconn/tracker-core`. Do not abstract something that has only one use.
- Shared packages to check first: `@exyconn/ui` (MUI wrapper and design tokens), `@exyconn/shell` (layout, `DataTable`, `ServerDataGrid`, `CrudDialog`, `CrudFormPage`), `@exyconn/crud`, `@exyconn/tabber`, `@exyconn/regex`, `@exyconn/time`, `@exyconn/i18n`, `@exyconn/logger`, `@exyconn/rich-text`, `@exyconn/live-editor`, `@exyconn/login`, `@exyconn/config` and `@exyconn/tracker-core`.
- When a shared package changes, update its README and its demo, if it has one.

### Design system, tables, tabs, regex
- Never hard-code colours, shadows, spacing, borders, typography or radius. Use the tokens in `@exyconn/ui` (portals and desktop tracker), the Tamagui tokens (phone) and `src/styles/tokens/*.ts` (website).
- Every portal table uses the shared grids from `@exyconn/shell` (`ServerDataGrid` for server-paged lists, `DataTable` otherwise). Never import MUI's `DataGrid` directly.
- Never render MUI `<Tabs>`/`<Tab>` directly. Use `@exyconn/tabber`, with the selected tab kept as a URL slug.
- All form patterns come from `@exyconn/regex`. If a pattern is missing, add it there first, then use it in portals, the desktop tracker and the phone tracker. Never write a regex inline in a form.

### Localization and date/time
- Never hard-code user-facing text. Use `@exyconn/i18n`, where the English source string is the key. Server translations from the `i18n` module come first; the shipped English is only the fallback when no translation exists. Follow the existing catalogue and seed flow when you add strings.
- Dates and times go through `@exyconn/time` and `@exyconn/i18n` formatters (date-fns, admin-configured timezone and format) and MUI X pickers (rule 11).

### GraphQL and API contracts
- Reuse existing operations, fragments and generated types. Request only the fields you need. Avoid duplicate requests and N+1 resolvers, and paginate or filter lists.
- When behaviour changes on the frontend or backend, check the typeDefs, the root `pnpm codegen` output, Zod validation and every consumer together. Do not break existing APIs, schemas, imports, exports or user flows without a reason.

### Sensitive modules: Finance, Payroll, Attendance, Auth/MFA, Admin, Localization
- Before changing these, understand the full business and data flow: calculations, rules, edge cases, dependencies, security, auditability and backward compatibility. Correctness comes before speed.
- Enforce permissions on the server; never rely only on hiding UI. Record overrides and sensitive changes through the existing `audit` module.
- Guard against partial, duplicate or inconsistent writes. Think through race conditions, retries, parallel updates and stale data. Make payments, notifications, migrations and retryable jobs idempotent, using the boot `runOnce` ledger for migrations.
- Attendance uses the existing HR attendance module (`modules/hr/attendance.*`) and the tracker workday/presence services. MFA/OTP uses `modules/auth/mfa.service.ts` and `utils/totp.ts`. Never build a parallel attendance or OTP flow.
- Before any database change, check query performance, indexes, migrations, destructive operations, data integrity and how to roll it back. Everything is organization-scoped through the multi-tenancy plugin.

### Engineering hygiene
- Handle loading, success, error, empty, disabled and populated states. Check portals at phone, tablet and desktop widths.
- Never fail silently. Give the user clear feedback and log diagnostics through `@exyconn/logger`, with no secrets or personal data in logs.
- Avoid unnecessary renders, API calls, expensive computation and bundle growth. Understand the existing Apollo cache and invalidation before you change caching.
- Before adding a dependency, check whether an existing package already covers the need.
- Keep local, staging and production config, credentials and data separate.
- For changes that affect production, know the recovery path first. Infrastructure changes stay reproducible through `deploy/`, `docker/` and `DEPLOYMENT.md`.
- Website changes (Astro) need semantic HTML, metadata, canonical URLs, structured data and crawlability.
- Accessibility follows WCAG 2.2 AA: keyboard navigation, visible focus, screen-reader support, and accessible forms, dialogs, tables, errors and dynamic content.
- Email templates are edited in Tech > Email, never as local MJML (rule 28).
- The tracker version is a single number across the desktop and phone apps (rule 33).
