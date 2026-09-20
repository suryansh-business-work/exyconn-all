# The reminder sweep

Eight modules stored a date that meant somebody had to act, and not one of them was ever
read. A contract expired, a risk fell past its review date, a corrective action went
overdue, a follow-up was promised and missed — and the record simply sat there. The fields
were indexed for an overdue view nobody had built.

The sweep is that view, except it comes to you.

## One loop, many sources

There is no reminders table of things to chase. A module owns its own dates and answers one
question about them:

```
sweepReminders ──┬─ legal              contracts inside their last month, policies past review
                 ├─ compliance         risk reviews, corrective actions, minuted actions
                 ├─ crm-followups      activities due, summarised into one notice a day
                 ├─ finance-receivables newly overdue invoices
                 ├─ support-sla        tickets about to breach, and breached
                 ├─ projects-due       tickets and bugs due or late
                 ├─ it-expiry          warranties, licence renewals, certificates
                 ├─ products-low-stock lines at or below their reorder level
                 └─ hr-people          probations ending, onboarding tasks overdue
```

A source is registered from the module that owns the records, at import time:

```ts
registerReminderSource({
  key: "legal",
  label: "Contract expiry and policy review",
  async due(now) {
    return [
      {
        dedupeKey: `contract-expiry:${id}:${dayKey(now)}`,
        kind: "LEGAL",
        title: "Nimbus MSA expires in 10 days",
        body: "Renew it, replace it or mark it terminated.",
        link: "/legal/contracts",
        roles: [ROLES.LEGAL],
      },
    ];
  },
});
```

The module decides what is worth chasing and who should hear it. The sweep decides when,
delivers it and remembers that it did. A source that throws costs its own group and nothing
else: one module's bad query must not silence the other eight.

## Chased once, not once an hour

The loop ticks hourly, and a due date stays due for weeks. Without a memory a contract
expiring on Friday would notify its owner every hour until somebody renewed it, which is
how people learn to ignore a notification bell.

`ReminderLog` is that memory, and the **dedupe key is the whole mechanism**. The key
carries the window it covers — `contract-expiry:<id>:2026-09-20` — so the same thing is
chased once a day, and a source that deliberately nags weekly says so by putting the week
in its key instead of the day.

The claim is an upsert that reports whether it inserted: whoever inserts, sends. Two
processes sweeping the same minute cannot both send, and the unique index behind it settles
the race. The row is written **before** the notification, because sending first and
recording after would double-notify on any crash in between.

## Hourly, not daily

A daily loop in a process that restarts most days would skip whole days. Asking every hour
costs one indexed query per source, because anything already chased is refused by the log.

## Who hears it

A reminder names people, roles, or both:

- `employeeIds` — the owner of the record, when it has one.
- `roles` — "every compliance officer", "the finance team". Active accounts only.

Duplicates collapse, so the owner of a risk who is also a compliance officer is told once.
Delivery then goes through the notification preferences (`modules/notifications/delivery.ts`),
so a kind somebody has turned down is turned down here too — which matters most here,
because the sweep is exactly the thing that would otherwise fill a bell nobody reads.

## Summarised, not itemised

Some sources produce one notice per record; some produce one notice a day for the lot. The
rule is what a reader can act on. A sales desk can carry thirty open follow-ups and a
catalogue can have forty lines at their reorder level; thirty notifications every morning is
not a reminder, it is noise. Those sources name the first few and count the rest.

## Where to look

| File                                      | What it is                                                        |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `modules/reminders/reminders.registry.ts` | The registry a module calls at import time.                       |
| `modules/reminders/reminders.notify.ts`   | The claim, then delivery through preferences.                     |
| `modules/reminders/reminders.sweep.ts`    | The hourly loop, per company, with its heartbeat.                 |
| `modules/reminders/reminders.dates.ts`    | `dayKey`, `daysUntil`, `dueInWords` — how a reminder says _when_. |
| `modules/<module>/<module>.reminders.ts`  | One module's answer to "what needs chasing".                      |

The sweep reports to `systemHealth`, so **Admin › System Health** shows whether it is alive
and what the last tick did.

## Adding a source

1. Write `modules/<yours>/<yours>.reminders.ts` and call `registerReminderSource`.
2. Import it for its side effect from your module's `index.ts`.
3. Put the window in the dedupe key.
4. Add a test: seed something due, sweep, assert the notification — and sweep twice to prove
   it is sent once.
