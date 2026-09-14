# Compliance: one management system for four standards

`compliance.exyconn.com` is the ISO management system. ISO 9001 (quality), 27001 (information
security), 45001 (health & safety) and 14001 (environment) ask for the same five records, so
the portal keeps one set of them and each record says which standards it answers to. A company
certified to three standards keeps one risk register, not three.

| Register          | Clause | What it holds                                                              |
| ----------------- | ------ | -------------------------------------------------------------------------- |
| Risks             | 6.1    | What could go wrong, its rating before and after the controls, who owns it |
| Objectives        | 6.2    | What the company set itself, how it is measured, where it has got to       |
| Audits            | 9.2    | The audit programme, each audit's scope and criteria, and its conclusion   |
| Findings & CAPA   | 10.2   | Nonconformities, root cause, corrective action, and whether it worked      |
| Management review | 9.3    | What leadership considered, decided, and left somebody to do               |

Everything is per company (`organizationId`, see [multi-tenancy.md](./multi-tenancy.md)) and
sits behind the `COMPLIANCE` role.

## Decisions worth knowing

**References come from the company's own series.** `RISK-0001`, `AUD-0001`, `NC-0001`,
`MR-0001`, drawn from `lib/sequence` on create and never accepted from a client. A finding
cites the audit that raised it and the risk it realises, so the three read as one story.

**A risk carries two ratings.** Inherent (likelihood × impact, with nothing done) and residual
(after the controls named on it). Keeping only the second loses the argument for why the
controls exist. The 1–25 rating is banded in one place — `compliance.constants.ts` on the
server, mirrored in the form so it can say "Critical" while somebody is still choosing.

**An objective is three numbers, not a percentage.** Baseline, target, actual. An objective to
REDUCE something — fewer complaints, less waste — reads as progress when its measure falls,
which "percent complete" cannot express. `objectiveAchievement` derives the percentage.

**A finding closes on evidence.** Clause 10.2 ends by asking whether the corrective action
worked, so the API refuses `status: CLOSED` unless a verification date and an effectiveness
answer are on the record. The rule lives in the resolver, not only in the form: a rule the UI
alone knows is not a rule the API has. "Nobody has checked yet" is kept distinct from "it did
not work" — `effective` is a nullable boolean for exactly that reason.

**A management review is written, not generated.** Its inputs are text typed by whoever
minuted the meeting rather than a live query of the registers. The standard asks what
leadership CONSIDERED on the day; a minute that re-rendered from today's data would say
something different every time it was opened.

## What is deliberately elsewhere

Controlled documents and policy acknowledgements are the Legal portal's (`legal/policies`);
training records are HR's; the asset register is IT's; the append-only change log behind
Admin › Audit Log is `modules/audit` — a different thing from an internal audit, despite
the name.

## Document control lives in Legal

A policy (`legal/policies`) carries what a controlled document has to: a version that
signatures are recorded against, an owner, a **classification** (ISO 27001 A.5.12 — how far it
may travel, which is not the same question as who may open it), a **next review date**, and
**who approved it**. Publishing IS the approval, so the approver and the date are recorded
then rather than typed afterwards. Whether a review is overdue is derived on read, never
stored — a stored flag is only true until the clock moves.

## Still to come

- An information-asset register with owners and CIA classification, for 27001 specifically.
- Access-review campaigns, and supplier evaluation with criteria and a re-evaluation cycle.
- Findings raised straight from an audit's own screen, rather than filed and linked.
