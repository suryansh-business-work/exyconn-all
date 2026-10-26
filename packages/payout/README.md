# @exyconn/payout

Where money is paid out to: an employee's **salary account** (HR › employee) or a client's
**refund account** (client hub › Refund accounts). Pure TypeScript; the portal forms use it from
source and the portal server from the compiled `dist`, so both refuse exactly the same details.

## Methods

| Method | Salary | Refund | Asks for |
| --- | --- | --- | --- |
| `BANK_TRANSFER` | ✓ | ✓ | Holder, bank, the country's identifiers (below), BIC |
| `UPI` | ✓ | ✓ | UPI ID and/or the UPI-linked +91 mobile — India and INR only |
| `PAYPAL`, `WISE`, `PAYONEER` |  | ✓ | Holder and the account's email |
| `WESTERN_UNION` |  | ✓ | Receiver's name as on ID, city, state (US/CA/MX), phone |

## Bank identifiers by country

| Country | Identifiers |
| --- | --- |
| IBAN countries (SWIFT IBAN Registry, incl. territories under FR/FI/GB) | IBAN required (ISO 13616 length + MOD 97-10), BIC optional |
| India | Account number (9–18 digits) + IFSC, account type optional |
| United States | Account number (4–17) + ABA routing (check digit) + account type |
| United Kingdom | Account number (8) + sort code; IBAN optional |
| Canada | Account number (7–12) + institution and transit (8) |
| Australia | Account number (5–9) + BSB (6) |
| New Zealand | Bank-branch-account-suffix (15–16 digits) |
| Everywhere else | Account number + BIC (SWIFT transfer) |

The BIC's country (characters 5–6) must match the account's country.

## API

- `fieldsFor(method, country)` — the fields to ask for, in order, with label, hint and need.
- `payoutIssues(details, stored?)` — every problem, by field. `stored` names sealed fields the
  server already holds, so an edit may leave them blank.
- `normalizePayout`, `onlyAskedFields` — the stored form, and the details without stale fields.
- `payoutSummary`, `secretHint`, `maskTail`, `maskAddress` — what a page shows instead.
- `SECRET_FIELDS` — `accountNumber`, `iban`, `upiId`, `phone`, `walletEmail`: sealed at rest.
