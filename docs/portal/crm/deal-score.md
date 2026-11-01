# CRM: deal score and meeting notes

## Deal score

Every deal carries `score` (0-100), `scoreReasons` (each with the points it added or took away)
and `scoredAt`. It is computed on the server, never typed, by `crm/deal-score`:

| Signal                                                   | Points                                             |
| -------------------------------------------------------- | -------------------------------------------------- |
| Stage (Qualifying, Discovery, Proposal, Negotiation)     | 15, 30, 50, 65 to start from                       |
| Time in the current stage (`stageEnteredAt`)             | +5 within 14 days, -10 after 30, -20 after 60      |
| Last activity on the deal, its contact or its company    | +10 within 7 days, +5 within 30, -10 older or none |
| 3 or more activities in 30 days                          | +5                                                 |
| Overdue open tasks                                       | -5 each, at most -15                               |
| Emails from the contact in 30 days (connected mailboxes) | +5 each, at most +15                               |
| 2 or more emails sent in 30 days with no reply           | -5                                                 |
| Expected close date has passed                           | -10                                                |

Won is 100 and Lost is 0. The rules are pure functions in `deal-score.signals.ts`; the score is a
transparent rules model rather than an LLM call, so it costs nothing and every point is explained.

A deal is rescored when it is created, updated or moved on the board, when meeting notes are filed
on its contact, every 6 hours by the `crmDealScores` background job (Tech > Jobs can run it now),
and on demand with `scoreDeal` / `scoreOpenDeals`. The list shows a Score column (sortable), the
board card shows it beside the probability, and a deal's edit page lists every reason with a
Rescore now button.

## Meeting notes on the CRM timeline

When the Meeting Assistant finishes notes for a call (`jobs.runner.ts`, ANALYZE step), the CRM
looks up every participant with a **verified** email (never a name guess) among its contacts. Each
matching contact, and each of their open deals, gets a `MEETING` activity with the summary, the
action items and a link to the full notes. The activity's `sourceKey`
(`meeting:<meetingId>:<CONTACT|DEAL>:<id>`) makes a regenerate update the same row. A CRM failure
is logged and never fails the notes step.

Both are on the CRM MCP server (`deal-score.typeDefs.ts`; the activities are ordinary activities).
