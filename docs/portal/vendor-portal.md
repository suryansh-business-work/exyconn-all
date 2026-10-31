# Vendor portal (vendors.exyconn.com) and Developers (developers.exyconn.com)

## Vendor portal

Where a supplier's own people see the purchase orders a company sent them, acknowledge them,
send invoices against them and follow when those invoices are paid. It mirrors the client hub
(see [client-hub.md](./client-hub.md)).

### Who can sign in

- Products staff open **Products › Suppliers**, pick a supplier and use **Vendor portal access**
  (the key icon) to add a person's name and email. They are emailed where to sign in
  (template `vendor-portal-invite`, link from `VENDOR_PORTAL_URL`).
- Signing in is the email plus a six-digit code (template `vendor-portal-code`, purpose
  `vendor-portal`). There is no password. A session lasts 30 days.
- An email can have access at one supplier only, across every company (`VendorContact.email` is
  in `PLATFORM_UNIQUE_PATHS`).
- Switching a person off, or removing them, signs them out straight away (token version).
- A contact is **not** a portal user. Their pass (`x-vendor-pass`, `lib/scopedPass.ts`) only
  opens the vendor portal's own operations, and each one reads only that supplier's records,
  inside the buying company. See `server/src/modules/vendor-portal`.

### What a supplier does

| Screen          | What it shows                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| Purchase orders | Every order sent to them (never drafts). **Acknowledge** stamps `acknowledgedAt`/`acknowledgedBy` on the order. |
| Invoices        | What they sent: review status (Submitted, Approved, Rejected with the reason) and payment status.               |

**Send an invoice** (upload icon on an order) takes the supplier's invoice number, dates, amount
and the document (PDF or image, uploaded through `vendorUploadInvoiceFile`). A number already
sent and not rejected is refused.

### Review and payment

- **Products › Vendor invoices** lists every invoice (Products or Finance role, permission
  module `VendorInvoice`).
- **Approve** files the invoice as an unpaid Finance bill (`CompanyExpense`, category
  `SERVICES`, reference = the invoice number). The status is claimed in one write first, so two
  reviewers cannot file two bills.
- **Reject** sends it back with a reason the supplier sees.
- **Payment status** is read from that bill: marking the bill paid in **Finance › Expenses**
  shows the supplier `PAID` with the paid date. There is no second copy of it.

Every change is in the audit log (`Supplier`, `PurchaseOrder`, `VendorInvoice`); vendor writes are
filed under `vendor:<contact id>`. Webhooks `purchase_order.acknowledged` and
`vendor_invoice.submitted` are sent for both supplier actions.

## Developers

API keys and webhooks moved here from **Admin › Integrations** (the old address redirects). It is
an administrator's portal (`ADMIN`).

| Screen          | What it does                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| API keys        | Mint and revoke keys; the chart icon shows requests per UTC day (`apiKeyUsage`, counted in `ApiKeyUsage`). |
| Webhooks        | Add, pause and delete endpoints; the signing secret is shown once.                                         |
| Delivery log    | Every delivery attempt across endpoints, paged (`listWebhookDeliveriesPaged`), with the exact signed body. |
| Event catalogue | Every event, its module and the fields of its `data` (`webhookEventCatalogue`, `webhook.catalogue.ts`).    |
| API reference   | Each module's operations with arguments and an example document (`apiReference`, from the MCP catalogue).  |
| Claude (MCP)    | Each MCP server's address and a link to its page on mcp.exyconn.com.                                       |

A new webhook event goes in `WEBHOOK_EVENTS` and in `webhook.catalogue.ts` (the compiler insists).
