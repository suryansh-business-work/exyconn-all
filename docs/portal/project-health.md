# Project health

A project already carried everything needed to say how it was going — tickets on a board,
bugs in the tracker, hours from the same billing service the time log reads, its own dates
and budget. What it could not do is say it in one place.

`projectHealth` says it. Nothing here is entered twice, which is the only reason a health
page is still true a month after it is built.

## Somebody has to say what "done" means

A board's columns are whatever the team named them, and nothing seeds a default set. So
there was no notion of finished to count against — and the obvious shortcut, treating the
last column as done, quietly counts **Blocked** or **Won't do** as delivered on any board
that keeps one at the end. Progress is exactly the number nobody re-checks, so it must not
be the one built on a guess.

`BoardColumn.isDone` is therefore explicit: a tick in the column header, set once per board.

**Until a column is marked, `progressPercent` is `null` — not `0`.** Zero reads as "nothing
done"; null lets the page say *"mark a board column as done to track this"*, which is the
truth. The same rule governs `budgetUsedPercent` (null with no hours budget) and
`utilisation` in [budgets.md](./budgets.md): a percentage of nothing is not zero.

## Risk says why

| Reason | Fires when |
| --- | --- |
| Past its end date | today is beyond `endDate` and the project is not COMPLETED |
| Over its agreed hours | logged hours exceed `budgetHours` |
| Behind where the calendar says it should be | progress trails elapsed time by more than 20 points |

`risk` follows from how many fired: none → LOW, one → MEDIUM, two or more → HIGH.

`riskReasons` ships with it, because a rating nobody can question is a rating nobody trusts.
A single opaque red dot invites an argument; a red dot that says *"past its end date"* ends
one.

**UNKNOWN is not LOW.** A project with no done column, no end date and no hours budget has
nothing measurable set up, and reporting that as healthy would be the most misleading thing
on the page. Silence is not good news.

## What each figure is read from

| Figure | Source |
| --- | --- |
| `progressPercent` | tickets in `isDone` columns ÷ all tickets on the project |
| `openBugCount` | bugs on the project still OPEN or IN_PROGRESS |
| `loggedHours` | `trackerBillingService.billingByProject` — the same numbers the time log tab shows |
| `teamSize` | distinct assignees holding a ticket |
| `timeline` | the project's own `startDate`/`endDate`, plus COMPLETED status |

Hours come from the billing service rather than a fresh aggregation on purpose: two
different totals for "hours on this project", on two tabs of the same page, is a bug report
waiting to be filed.

## Where it shows up

- **A project → Health tab** — the first tab, because it is the question asked before any
  other
- **The board column header** — the tick that marks a column as the end of the line
