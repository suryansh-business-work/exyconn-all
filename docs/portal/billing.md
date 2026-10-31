# Self sign-up, plans and billing

A company can sign itself up, try a plan, and pay for it through Stripe or Razorpay. The
server module is `exyconn-portal/server/src/modules/billing`; the screens are Admin › Billing
(every company's ADMIN), Admin › Plans and the Plan action on Admin › Organizations
(SUPER_ADMIN), and `/signup` on every portal (public, from `@exyconn/login`).

## Data

| Model                 | Scope                    | What it holds                                                                                         |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `BillingPlan`         | platform                 | The catalogue: prices per ISO 4217 currency, interval, trial days, seat limit, modules, AI cap, flags |
| `BillingSubscription` | tenant (one per company) | `key: 'current'`: plan, status, provider, gateway ids, trial end, period end, `lastEventAt`           |
| `BillingWebhookEvent` | platform                 | Ledger of Stripe/Razorpay subscription events, unique on `(provider, eventId)`                        |

Limits of `0` mean unlimited. `allModules` opens every module, present and future; otherwise
`modules` lists module roles. ADMIN and EMPLOYEE are open on every plan, so a company can always
reach Admin › Billing and its people their own workspace.

Statuses: `TRIALING`, `ACTIVE`, `PAST_DUE` (renewal failed, access continues while the provider
retries), `CANCELLED`. A subscription is **lapsed** when it is cancelled or its trial ended
unpaid; a lapsed company keeps only ADMIN and EMPLOYEE, and runs no AI.

A company with **no subscription row** is not limited at all. That is every company a
SUPER_ADMIN creates by hand until somebody places it on a plan.

## Grandfathering

Boot ensures the system plan `grandfathered` (every module, no limits, no charge, not public,
cannot be retired or deleted) and then runs `runOnce('billing-grandfathered-plan')` in every
company: an insert-only `ACTIVE`/`MANUAL` subscription on it. Nothing changes for a company
that existed before billing.

## Self sign-up

1. `requestSignupCode(email)` — rate-limited by address and IP; refuses an address that already
   has an account; issues an `issueEmailCode('saas-signup')` code inside the **platform
   operator** company and mails the `saas-signup-code` template (seeded by `ensureEmailDefaults`,
   edit it in Tech › Email).
2. `completeSignup(input)` — spends the code (atomic, single use), creates the company through
   `organizationService.create` (provisioned like any other), appoints the person with
   `assignAdmin` (they are emailed a temporary password as every administrator is), starts the
   plan's trial (`startTrial`, insert-only; a free plan starts `ACTIVE`) and returns a session
   from `authService.issueSession`. Both steps are audited in the new company's log.

`signupPlans` lists active, public, non-system plans. With none, the page says sign-up is not
open.

## Checkout and webhooks

`startBillingCheckout({ planId, currency, provider })` (ADMIN) opens a hosted page and returns
its URL. Nothing about the subscription changes until the provider's signed webhook arrives.

- **Stripe**: a Checkout Session in `subscription` mode with an inline recurring price; the
  company and plan ride in `metadata` and `subscription_data.metadata` (`billing: saas`). Trial
  days still owed carry over as `trial_period_days`.
- **Razorpay**: a Razorpay plan is created once per price and cached on the plan
  (`razorpayPlans`); the subscription carries `notes` with the company and plan, and `start_at`
  for trial days still owed.

Both use the existing receivers — `/webhooks/stripe` and `/webhooks/razorpay`, with the same
signature checks and keys (Tech › Environment Variables). `clienthub/payments/webhook.ts` hands
`checkout.session.completed` in subscription mode, `customer.subscription.*` and Razorpay
`subscription.*` events to `billing.webhook.ts`; everything else is a client hub payment as before.

Every event is applied **exactly once and in order**:

- the ledger row is inserted first; a retry of the same event id hits the unique index and is
  acknowledged without being applied again; if applying throws, the row is removed and a 500
  makes the provider retry;
- the subscription update is conditional on `lastEventAt <= eventAt`, so a late delivery never
  rolls the status back;
- each applied event is audited in the company it concerns, under the gateway as actor.

Razorpay events need the `x-razorpay-event-id` header; one without it is refused with 400.

**Operator setup**: on the existing Stripe webhook endpoint, also enable
`checkout.session.completed` (already on), `customer.subscription.created`,
`customer.subscription.updated` and `customer.subscription.deleted`. On the Razorpay webhook,
enable the `subscription.*` events (authenticated, activated, charged, pending, halted,
cancelled, completed).

`cancelBillingSubscription` (ADMIN): a gateway subscription is cancelled at the end of the
paid period (Stripe `cancel_at_period_end`, Razorpay `cancel_at_cycle_end`) and the webhook marks
it `CANCELLED`; a trial or manual one ends at once. `assignOrganizationPlan` (SUPER_ADMIN) puts a
company on any plan by hand (`MANUAL`), audited in that company.

## Enforcement (server first)

- **Modules** — `buildContext` reads the company's access (`planAccessFor`, cached a minute per
  process, invalidated on every change made in this process) and narrows `ctx.user.roles` to the
  plan. `assertRole` additionally refuses an ADMIN a module outside the plan
  (`ctx.planRoles`). A SUPER_ADMIN is never narrowed.
- **Seats** — active people (not SUPER_ADMIN) against `seatLimit`, checked in
  `adminService.createUser`, `updateUser`/`setUserActive` when switching someone on, and
  `organizationService.addMember`. The check runs before the write and again after it; a
  concurrent add that passed both pre-checks is undone, so the limit is never exceeded.
- **AI** — `assertWithinAiBudget` first applies the plan: a lapsed company runs no AI, and a
  monthly USD cap stops at the company's spend this calendar month. The company's own caps
  (Tech › AI Pricing) still apply below it.
- **Shell** — `me.planRoles` (and the sign-in answer) carries the plan's module roles;
  `canAccess`, `accessibleModules`, the sidebar, portal switcher, command palette and
  `ProtectedRoute` hide what the plan leaves out. This is presentation only; the server decides.

## MCP

`billingTypeDefs` is on the Admin MCP server (`/mcp/admin`): `billingPlans`,
`billingOverview`, `organizationSubscription`, `createBillingPlan`, `updateBillingPlan`,
`deleteBillingPlan`, `startBillingCheckout`, `cancelBillingSubscription`,
`assignOrganizationPlan`. The public sign-up operations (`signupTypeDefs`) are deliberately not
tools.
