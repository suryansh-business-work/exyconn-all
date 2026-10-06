# Client hub (clienthub.exyconn.com)

The client hub is where a client's own people pay invoices online, download or email them,
export their transactions as CSV, raise and follow support tickets, and see their projects.

## Who can sign in

- An administrator opens **Admin › Clients**, picks a client and uses **Client hub access**
  (the key icon) to add a person's name and email. They are emailed a link to the hub
  (template `client-hub-invite`).
- Signing in is the email plus a six-digit code (template `client-hub-code`). There is no
  password. A session lasts 30 days.
- Several people can have access to one client. An email can belong to only one client.
- Switching a person off, or removing them, signs them out straight away.
- A contact is **not** a portal user. Their pass (`x-client-pass`) only opens the client hub's
  own operations, and each operation reads only that client's records, inside that client's
  company. See `server/src/modules/clienthub` and `lib/scopedPass.ts`.

## Paying online

Payments use Exyconn's own gateway accounts, so online payment is offered only on invoices
issued by Exyconn's own (platform operator) company.

1. In **Tech › Environment Variables**, open the **Stripe**, **Razorpay**, **PayPal** and/or
   **Payoneer** tab and add
   the account. One account of each kind is active at a time. Secrets are stored encrypted
   and only their last four characters are ever shown. **Test connection** checks the keys.
2. Register the webhook on the gateway's dashboard, using the address shown on the form:
   - **Stripe**: `https://portal-server.exyconn.com/webhooks/stripe`, events
     `checkout.session.completed`, `checkout.session.async_payment_succeeded` and
     `checkout.session.expired`. Then paste the endpoint's signing secret (`whsec_…`).
   - **Razorpay**: `https://portal-server.exyconn.com/webhooks/razorpay`, events
     `payment_link.paid`, `payment_link.expired` and `payment_link.cancelled`, with the same
     secret entered on the form.
   - **PayPal** (client id + secret from a REST app, Sandbox or Live):
     `https://portal-server.exyconn.com/webhooks/paypal`, events `CHECKOUT.ORDER.APPROVED`,
     `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED` and `CHECKOUT.ORDER.VOIDED`; paste the
     webhook's id on the form. Every delivery is verified with PayPal before anything is
     recorded, and the order is also captured the moment the payer returns to the client hub.
   - **Payoneer Checkout** (merchant code + API token, optional division, Sandbox or Live):
     nothing to register — each checkout tells Payoneer to notify
     `https://portal-server.exyconn.com/webhooks/payoneer`. Notifications are not signed, so the
     server reads the charge back from Payoneer and records it only when Payoneer reports it
     charged for that attempt, in its amount and currency. Payoneer needs the payer's country:
     the client's country (Admin › Clients), else the company's.
3. A client clicks **Pay**, chooses Stripe (card), Razorpay (UPI, card, netbanking), PayPal or
   Payoneer, and pays
   the whole balance on the gateway's hosted page. Card details never reach our servers.
4. The signed webhook records the payment on the invoice exactly once, through the same
   `applyPayment` that finance uses: ledger row, invoice status, audit log and the
   `invoice.paid` integration webhook. If the money arrives but cannot be recorded (for example
   finance already entered it by hand), the attempt is marked `REVIEW` and logged for finance
   to reconcile.

## Reminders

- **Due soon**: once, 3 days before an unpaid invoice falls due (template `invoice-due-soon`),
  sent by the hourly receivables sweep.
- **Overdue**: the existing chase at 3, 14 and 30 days late (`invoice-overdue`), now with a
  **Pay now** link. The stored template is upgraded automatically only if nobody has edited it.
- Both links open `clienthub.exyconn.com/invoices?pay=<invoice>`.
- In the hub, the overview's **Payment reminders** panel lists every unpaid invoice, soonest due
  first, each with a **Pay now** button.

## Projects

Projects show in the hub when the project's **Client** is set in **Projects › Project**. The
view is the same read-only one a share link gives: status, dates, hours against budget,
milestones and tickets per column. It never includes comments or per-person time.
