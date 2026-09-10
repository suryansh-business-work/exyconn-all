# Cost centres, budgets and variance

Finance could already say what the company earned, spent, collected and paid — `companyFinance`
answers all four, on both an accrual and a cash basis. What it could not say is whether any of
that was what anybody *intended*.

Three records close that gap: a **cost centre** to spend against, a **budget** per centre per
month, and a report that puts the two beside each other.

## Why monthly, and only monthly

Every actual figure in Finance is bucketed by month (`monthKey` in `finance.summary.ts`). A
budget with its own arbitrary bounds could only be compared against those buckets by
apportioning it across them — and an apportioned budget is a guess wearing a number's clothes.

So a budget is `{ costCenterId, month: 'YYYY-MM', amount }`, unique on the first two. A quarter
is three rows. The form validates the same `YYYY-MM` shape the server stores, because a month
the report cannot match is a budget nobody will ever see again.

## What counts as "actual"

Company bills (`CompanyExpense`) booked to the centre. Deliberately **not**:

- **payroll** — salary slips carry no cost centre
- **reimbursed employee claims** — expense claims carry no cost centre either

Both are real company cost and `companyFinance` counts them. Folding them into a centre's
actuals without a centre to book them to would make a team look overspent on money it never
chose to spend. When either grows a cost centre of its own, it becomes another source here.

## Untagged spend is a row, not a rounding

`costCenterId` on a bill is optional — a company runs for years before it splits its spend up,
and refusing to record a bill until somebody picks a centre loses the bill, not gains the
analysis.

That means some spend belongs to no centre, and the report gives it a row called
**Unallocated** rather than dropping it. A variance report whose actuals do not add up to what
the company actually spent is worse than no report: it is a reconciliation nobody can close.

## Reading the numbers

| Field | Meaning |
| --- | --- |
| `budgeted` | Every budget row for the centre in a month the window touches |
| `actual` | Bills booked to the centre, by `incurredOn` — the accrual date, matching profit |
| `variance` | `budgeted - actual`. **Positive is money left; negative is an overspend.** |
| `utilisation` | Actual as a percentage of budget. **Null** where there is no budget — zero budget with real spend is not "infinite", it is unbudgeted |

A centre with neither a budget nor any spend in the window is left out; one with either still
has to answer for it, retired or not.

## Retiring, not deleting

A cost centre has `isActive` rather than being deleted. Retiring stops it being offered for new
spend while leaving every bill and budget already booked to it readable — deleting one would
silently detach that history, and last year's report would quietly change.

## Where it shows up

- **Finance → Cost Centres** — the register
- **Finance → Budgets** — one row per centre per month
- **Finance → Budget vs Actual** — the report, over the same period picker the overview uses
- **Finance → Company Expenses** — the form's Cost centre picker, which is what feeds all of it
