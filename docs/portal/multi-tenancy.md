# Multi-tenancy: one portal, many companies

The portal serves many companies ("organizations"). One database holds them all, and every
record carries the organization it belongs to. A person belongs to exactly one company; the
platform's own administrators (`SUPER_ADMIN`) stand above all of them, create them, and appoint
each one's first administrator — who then administers that company without the platform's help.

Every portal address names the company it shows: `hr.exyconn.com/organization/acme/hr/leave`.
An address without the prefix (a bookmark, an email link) is moved onto the signed-in person's
company as soon as the portal knows it.

## Working in another company (SUPER_ADMIN)

A platform administrator picks a company from the switcher in the top bar (shown once there is
more than one open company). It loads the same page under that company's address — a full page
load, so nothing of the previous company stays in the Apollo cache.

| Piece                                           | What it does                                                                                                                                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shell/src/config/organizationPath.ts` | Reads `/organization/:slug` from the address once; it is the router's `basename`, so routes and links are written without it. Cross-app links get it through `appBaseUrl()`.                                |
| Apollo `authLink`                               | Sends the slug as the `x-organization` header.                                                                                                                                                              |
| `server/src/middleware/actingOrganization.ts`   | Honours the header only for a `SUPER_ADMIN`, and only for an ACTIVE company; anyone else stays in their own company.                                                                                        |
| `OrganizationUrlSync` (shell)                   | When `myOrganization` (the company the API answered for) differs from the address, replaces the address with that company's — so a person cannot sit on another company's URL.                              |
| `TenantScope.self`                              | While a platform administrator works in another company, a lookup of **their own** account by its id still reaches it in their own company (profile, `me`). Lists of a company's people never include them. |

Each company's logo is uploaded in Admin › Organizations (ImageKit) and shown in the switcher.

## How isolation is enforced

Not by remembering to add a filter. `src/lib/tenant` puts it in the data layer:

| File                 | What it does                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant-scope.ts`    | The organization the work in hand belongs to, carried per request in an `AsyncLocalStorage`. A scope is either one organization or (deliberately) the platform. |
| `tenant-plugin.ts`   | A Mongoose plugin: adds `organizationId`, filters **every** query by it, stamps **every** write, and makes each unique index unique _within_ a company.         |
| `install.ts`         | Wraps `mongoose.model()` so the plugin is applied as each model is defined, and `assertTenantCoverage()` refuses to boot if a model was missed.                 |
| `platform-models.ts` | The models that are deliberately **not** a company's data. Everything else is tenant data by default.                                                           |

Three rules follow from this:

1. **No scope, no data.** Code that touches a company's records with no organization decided is
   refused (`TenantScopeError`) rather than quietly reading every company's. Requests get their
   scope from `middleware/tenant.ts` + `middleware/auth.ts`; anything else states its own.
2. **Crossing the boundary is explicit.** `runAsPlatform()` is the only way to read across
   companies — the sign-in lookup, the organizations console, migrations. It is meant to be
   conspicuous in a review.
3. **Await inside the scope.** `runForOrganization()` / `runAsPlatform()` await their callback,
   because a Mongoose query runs when it is awaited, not when it is built.

### What is platform-wide

The tenancy itself (`Organization`), shared infrastructure configured once for the install
(SMTP, ImageKit, GitHub, Slack, OpenAI, AI prices, tracker build settings), Exyconn's own public
presence (the website's content, the public status page), client error reports, the shared
translation catalogue, and sign-in artefacts. The support mailbox is deliberately **per
company**: each reads its own mailbox into its own tickets.

### What stays unique across the platform

A person's email address, because it is how they sign in. Everything else that was unique —
an invoice number, a product SKU, a department name — is unique _within_ a company, so two
companies can both have an `INV-001`.

## Roles

`SUPER_ADMIN` is the platform's role: create organizations, appoint their administrators,
suspend them, and work inside any open company by choosing it in the switcher — every request is
still confined to that ONE company. Their own roles (normally `ADMIN` alongside `SUPER_ADMIN`)
apply there. `ADMIN` remains the top of one company.

## Scheduled work

Everything that used to run once for the install now runs once per company, inside that
company's scope (`forEachOrganization`): payslip dispatch, tracker digests and retention,
campaigns, recurring invoices, webhooks, the AI queue and the support mailbox. One company's
failure is logged and the rest still run. The status monitor stays platform-wide.

## Migrating an existing install

**Nothing to do: the server migrates itself at boot**, before it serves a request. On the first
start after this ships, it creates the first organization from what the portal already says
about itself (branding and localisation settings), stamps every existing record with it, grants
the bootstrap account `SUPER_ADMIN` alongside its `ADMIN`, and rebuilds the indexes so the old
platform-wide unique ones become per-company ones.

It does nothing once any organization exists, and nothing at all on a fresh install — there,
the first company is created in Admin › Organizations.

To run it against a database outside a deploy (a restore, say):

```bash
pnpm --filter exyconn-portal-server exec tsx src/scripts/migrate-to-organizations.ts
```

## International by default

An organization states its country (ISO 3166-1), currency (ISO 4217), language (BCP 47),
timezone (IANA), the month its financial year opens and the tax system it bills under. These are
validated against the runtime's own ICU data (`utils/iso.ts`) rather than a list in this
repository, and they are what a company's screens fall back to when a person has not chosen
their own.

`lib/company.ts` is how the server reads them: `companyProfile()` answers with the company in
scope, and every document that prints money or a date is written from it — an invoice, a payslip,
the finance trend, the HR headcount chart. Nothing renders `₹` or `en-IN` because it was written
that way; a German company's invoice reads `82.500,00 €` and says `Sept. 2026`.

In the browser the same figures arrive on `appSettings` and reach the formatters through
`@exyconn/i18n`, so `formatMoney()` and `RhfCurrencyField` are in the company's money without a
screen being told what it is.

### India is a regional pack, not the default

`taxSystem` (`NONE`, `VAT`, `INDIA_GST`) decides whether India's rules apply. Only `INDIA_GST`:

- prints a **Tax Invoice** carrying GSTINs, a place of supply, HSN/SAC codes and CGST/SGST/IGST
  heads — everyone else gets an **Invoice** with a single Tax row;
- starts payroll with **PF, ESI and professional tax** enabled (`readPayrollSettings`);
- seeds the banded **income-tax table** (`ensureTaxSlabs`), which is meaningless elsewhere.

A company's own financial year comes from its `fiscalYearStartMonth` — April in India, January in
much of the world — rather than from a constant.

## Still to come

- Per-company branding on the sign-in page (today the first organization's branding is shown,
  since no company is known before sign-in) — resolve it from the address instead.
- Per-company SMTP identity; today one relay sends for the whole install.
- The platform console's own audit trail for organization changes.
- The interface itself in each company's language: the machinery is in place (`t()`), the
  English strings are still written into the screens.
