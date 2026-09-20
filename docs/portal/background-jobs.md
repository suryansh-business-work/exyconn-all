# Background jobs

Twelve loops carry the parts of this portal nobody is watching: the payslips that go out on
the day the schedule names, the invoices that fall overdue, the reminders, the support
mailbox, the status probes, the AI queue. They run inside the API process, on `setInterval`,
with no external scheduler and no queue broker — there is no Redis in this stack.

## The loops

| Key                 | What it does                                                             | Every      |
| ------------------- | ------------------------------------------------------------------------ | ---------- |
| `statusMonitor`     | Probes every monitored service; opens and resolves incidents             | 5 min      |
| `payrollDispatch`   | Emails the month's payslips when the schedule says                       | 1 min      |
| `trackerRetention`  | Deletes screenshots past the retention window                            | 1 hour     |
| `trackerDigest`     | Daily and weekly tracked-hours summaries                                 | 1 min      |
| `recurringInvoices` | Raises retainer invoices whose next run has arrived                      | 1 hour     |
| `overdueInvoices`   | Marks invoices overdue, clears them, sends the chases                    | 1 hour     |
| `webhookDelivery`   | Posts queued events to subscribed endpoints                              | 1 min      |
| `inboundMail`       | Turns support mail into tickets and replies                              | per config |
| `campaignSchedule`  | Sends campaigns whose scheduled moment has arrived                       | 1 min      |
| `aiQueue`           | Runs the oldest queued AI job, one at a time                             | 3 sec      |
| `reminders`         | Asks every module what has come due (see [reminders.md](./reminders.md)) | 1 hour     |
| `auditRetention`    | Deletes audit history past the window, when one is set                   | 4 hours    |

Each runs **per company** through `forEachOrganization`, so a loop's query is written as if
one company existed and the tenancy scope does the rest.

## Heartbeats are in memory, deliberately

`utils/jobHeartbeat.ts` holds the last tick of each loop in a `Map`, not in the database.
That is the point: a persisted timestamp survives the crash that stopped the loop, so a dead
scheduler would report as healthy. "Not since this server started" is the honest answer for a
loop that has not ticked in _this_ process.

Anything that must outlive a restart — the payroll period already sent, the digest date
already mailed, the reminder already chased — is stored by the service that owns it and read
alongside the heartbeat.

## Run now

**Tech › Background jobs** lists every loop with what it does and what its last pass
reported, and offers to take a pass immediately.

That is safe because every loop here is already idempotent: two processes may tick at the
same moment, so each claims its work with a compare-and-set, a unique dedupe key or a "last
run" period before doing any of it. Pressing the button twice does what two ticks would —
nothing the second time. It is the same pass the timer takes, called through the same
per-company fan-out, not a second implementation to keep in step.

A loop registers itself from its own file:

```ts
registerBackgroundJob({
  key: JOB_KEYS.reminders,
  label: "Reminder sweep",
  description: "Asks every module what has come due and tells whoever owns it.",
  runOnce: () => sweepReminders(),
});
```

`modules/tech/jobs.registry.ts` imports nothing from any module, on purpose: the modules
register while importing it, so anything it reached back for would be a cycle. The
per-company fan-out therefore lives with the resolver that runs a job.

## Adding a loop

1. Write the one-pass function so that running it twice is the same as running it once.
2. Call `recordJobRun(JOB_KEYS.yours, …)` at the end of the pass, with what it did.
3. `registerBackgroundJob` next to it, so it appears in the console.
4. Add a `jobRow` in `modules/health/health.service.ts` so System Health lists it.
5. Start it in `server.ts`, inside `forEachOrganization` unless it is genuinely platform-wide.
