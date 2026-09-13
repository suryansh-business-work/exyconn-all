# Multi-tenancy: one portal, many companies

The portal serves many companies ("organizations"). One database holds them all, and every
record carries the organization it belongs to. A person belongs to exactly one company; the
platform's own administrators (`SUPER_ADMIN`) stand above all of them, create them, and appoint
each one's first administrator — who then administers that company without the platform's help.

URLs did not change: `hr.exyconn.com` is still the HR portal, and which company you see comes
from who you signed in as.

## How isolation is enforced

Not by remembering to add a filter. `src/lib/tenant` puts it in the data layer:

| File | What it does |
| --- | --- |
| `tenant-scope.ts` | The organization the work in hand belongs to, carried per request in an `AsyncLocalStorage`. A scope is either one organization or (deliberately) the platform. |
| `tenant-plugin.ts` | A Mongoose plugin: adds `organizationId`, filters **every** query by it, stamps **every** write, and makes each unique index unique *within* a company. |
| `install.ts` | Wraps `mongoose.model()` so the plugin is applied as each model is defined, and `assertTenantCoverage()` refuses to boot if a model was missed. |
| `platform-models.ts` | The models that are deliberately **not** a company's data. Everything else is tenant data by default. |

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
an invoice number, a product SKU, a department name — is unique *within* a company, so two
companies can both have an `INV-001`.

## Roles

`SUPER_ADMIN` is the platform's role: create organizations, appoint their administrators,
suspend them. It is **not** a way to read a company's data — a platform administrator's session
carries no organization, so company queries are refused. `ADMIN` remains the top of one company.

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
timezone (IANA) and the month its financial year opens. These are validated against the
runtime's own ICU data (`utils/iso.ts`) rather than a list in this repository, and they are what
a company's screens fall back to when a person has not chosen their own.

## Still to come

- Per-company branding on the sign-in page (today the first organization's branding is shown,
  since no company is known before sign-in) — resolve it from the address instead.
- Per-company SMTP identity; today one relay sends for the whole install.
- India's GST/PF/TDS rules become one regional pack rather than the default.
- The platform console's own audit trail for organization changes.
