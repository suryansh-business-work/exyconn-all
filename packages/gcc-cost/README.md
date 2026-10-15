# @exyconn/gcc-cost

The cost model behind the GCC-in-India cost calculator on exyconn.com. It is pure TypeScript (Zod only), so
the website calculator (from source) and the portal server (email PDFs and share links, from the compiled
`dist`) compute every figure with the same code.

## What is in it

| Module | Purpose |
| --- | --- |
| `schema.ts` | The estimate, schema version 1 (strict Zod objects; inputs only, never totals) and the export file envelope |
| `factory.ts` | The calculator preset (scenario templates, AI price list, reference lists) and estimate/scenario creation and duplication |
| `headcount.ts`, `payroll.ts`, `office.ts`, `technology.ts`, `lines.ts` | Producers of dated charges, one per input |
| `engine.ts` | `calculateScenario`: every charge for 60 months plus monthly totals |
| `summary.ts` | `summarise`: the headline figures for the scenario's forecast window |
| `compare.ts` | `calculateEstimate` and scenario variance against the first scenario |
| `import.ts` | Safe JSON import (size, syntax, prototype keys, version, schema) and export |
| `csv.ts`, `report.ts`, `pdf.ts` | CSV export, the report model with methodology and disclaimer, the pdfmake document |

## Calculation rules

- Money is integer paise of INR. Each charge is rounded once (half away from zero) and totals are integer
  sums, so a report's totals equal the sum of its line items. Conversion to the reporting currency uses the
  rates stored with the estimate (`inrPerUnit`); an input priced in a currency without a rate is reported as a
  `missing-rate` issue, never silently dropped or guessed.
- The engine always projects 60 months. `forecastMonths` (12, 24, 36 or 60) only selects which months are
  totalled, so switching windows never changes an amount.
- Charge kinds: `setup` (one-time, charged once in the month it falls due), `operating` (recurring) and
  `deposit` (refundable; excluded from every cost total and counted only in the initial cash).
- Headcount ramps evenly from a role's hiring month over `rampMonths`; attrition (role rate, else the
  scenario's) is backfilled in the same month, costing recruitment fees but not headcount. Values are
  expected values and may be fractional.
- Payroll: salary rises on each anniversary by the role increment, else salary inflation. With
  `costBasis: 'gross'` the employer adds PF on the basic share (capped at `pfWageCeilingMonthly` when
  `pfWageCapped`), other statutory cost on gross and gratuity on basic. With `'all-inclusive'` none of these
  is added again. Benefits and shift allowance always apply.
- Office: remote-first has no office cost. Coworking and managed offices are priced per seat; leased and
  dedicated space per square foot (rent + CAM), with fit-out as setup and deposits held against occupancy.
  Expansions add seats, fit-out and deposit in their month. Occupancy and running costs escalate yearly.
- Technology: token cost = (input − cached) × input price + cached × cached price + output × output price,
  per million tokens, less the batch discount on the batch share. Budget mode replaces token usage with a
  fixed monthly amount. A device is bought per new position (setup) and replaced every cycle (operating).
- Cost lines: `flat` = quantity × unit price per occurrence, `per-employee` × headcount, `per-hire` × hires
  (monthly), `percentage` = rate × the month's pre-tax, non-optional operating cost of a base (payroll,
  office, technology or all operating), evaluated after every other charge and never on another percentage.
  Optional add-ons are reported apart; `review` items are counted and listed; disabled or not-applicable
  lines produce nothing. No user formula is ever evaluated.
- Totals: contingency is a percentage of pre-tax setup + operating; tax is shown separately before any
  input-tax credit; forecast total = setup + operating + tax + contingency (deposits excluded).
- Initial cash = month-1 setup with its tax + month-1 deposits + working capital (months × the first year's
  average monthly operating cost with its tax) + month-1 operating cost with its tax when paid in advance.
- Cost per employee per month = the phase month's pre-tax operating cost ÷ its headcount.
- Present value discounts each month's total at `(1 + r)^(month/12)`. Break-even needs a monthly benefit
  entered by the user; without one it is not calculated.

## Use

```ts
import { calculateEstimate, compareScenarios, parseEstimateFile } from '@exyconn/gcc-cost';

const imported = parseEstimateFile(text);
if (imported.ok) {
  const outcomes = calculateEstimate(imported.file.estimate);
  const variance = compareScenarios(outcomes);
}
```

Scripts: `build` (CommonJS `dist`, read by the server through the `require` export), `typecheck`, `lint`,
`test` (100% coverage gate).
