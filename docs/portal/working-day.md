# The working day

One employee record drives what the desktop tracker measures, what it will not let anybody do
until they have done it, and what they are asked to agree to. Five modules touch it, so this
is the contract between them.

## Where each fact lives

| Fact                                             | Owned by     | Stored on                                   | Read by                       |
| ------------------------------------------------ | ------------ | ------------------------------------------- | ----------------------------- |
| Working time (`FLEXIBLE`/`FIXED`/`OTHER`)        | HR           | `User.workingTime` + `workingTimeNote`      | Tracker, employee portal      |
| Work location (`OFFICE`/`HOME`/`HYBRID`/`OTHER`) | HR           | `User.workLocation` + `workLocationNote`    | Tracker, employee portal      |
| Hours in a working day                           | HR           | `User.workHoursPerDay`                      | Tracker's progress bar        |
| Photo, address, brief                            | HR           | `User.avatarUrl`, `address`, `brief`        | Employee record, profile card |
| Today's attendance                               | The employee | `Attendance` (one row per employee per day) | Tracker's start gate, HR      |
| Tracking disclosure                              | Legal        | `Policy` + `PolicyAcknowledgement`          | Tracker's consent screen      |
| Project a session books to                       | Projects     | `TrackerSession.projectId` / `projectName`  | Tracker reports               |

Hours are asked for in **every** working-time arrangement. A flexible day moves the clock
time, not the length of the day, and the tracker measures the same way whichever it is. The
house default is 8 hours, defined once on the server (`constants/work.ts`) and mirrored in
`@exyconn/shell`'s `components/work` so the form, the card and the bar all state one number.

Every field is nullable in the GraphQL schema and defaulted **on read**: `.lean()` skips
Mongoose defaults, so accounts created before these fields existed come back without them.

## One user record, one salary structure

An employee added in HR **is** the row the Admin console lists — same `User` document, same
roles, same `listUsers`. There was never a second table; what was missing was permission, so
`createUser` and `updateUser` now accept HR as well as ADMIN. `assertMayAssignRoles` is the
boundary on that: a non-admin may not grant the ADMIN role, and may not edit an existing
admin's account at all. Creating an employee provisions their portal account and emails the
temporary password, exactly as the Admin console always did.

Compensation is one `SalaryStructure` per employee, saved through `saveEmployeeSalary` — an
upsert keyed on the employee, because the employee form has no business knowing whether a
structure already exists. Two screens edit it (the employee record, and HR → Salaries) and
both mount the same `@exyconn/shell/components/pay` fields and schema; a pay type only one of
them could set would be a field the other silently reset.

`payType` decides which amounts mean anything, and `monthlyEarnings` is the one place that is
decided:

| Pay type            | What is paid             | What payroll's monthly slip uses                                                                    |
| ------------------- | ------------------------ | --------------------------------------------------------------------------------------------------- |
| `FIXED`             | basic + HRA + allowances | those components, unchanged                                                                         |
| `STIPEND` / `OTHER` | `rate`, per month        | the whole of `rate` as basic, so unpaid leave still prorates it                                     |
| `HOURLY`            | `rate`, per hour         | nothing — they are paid for hours tracked, and a monthly figure would invent money nobody agreed to |

`billingRate` is separate from all of it, and always per hour. Pay and bill-out are different
numbers even for an hourly employee, and the tracker needs the second one.

## What the desktop tracker does with it

`trackerMe` and `trackerHeartbeat` return the whole picture in one round-trip — settings,
work profile, today's workday, bookable projects and the consent policy — so a running app
adopts an HR change within a minute without a restart.

**The progress bar** fills with _active_ milliseconds only. Idle minutes are time at a desk,
not time worked, and a bar that counted them would fill on its own. The number is the portal's
total for the employee's local day, captured when the session opened, plus the live session on
top; a finished session is rolled into that base so the bar never drops back while an upload
is pending. Days are bucketed by Mongo's `$dateToString` in the employee's own zone — the same
way the calendar report is — so the bar and the report can never disagree about which day an
interval belongs to.

**Attendance gates tracking.** `trackerStartSession` refuses until the employee has marked
themselves in for their local day. The app greys out Start and the tray labels why, but the
mutation is what enforces it: a timesheet for a day nobody said they worked is a payroll
question with no answer. It is the same `{ employeeId, date }` record the employee portal's
"Mark attendance" writes, so marking in from either place counts once.

**Consent is a signature, not a checkbox** — when Tracker → Settings points
`consentPolicySlug` at a published Legal policy. The employee types their name, and the
signature lands in the same versioned ledger Legal and HR read. Re-publishing changed wording
raises the version, which drops the signature and brings them back to the consent screen. With
no policy chosen, the tracker falls back to its own `consentText` and a plain acceptance.

**Every session books to a project.** The list comes from the Projects module, `ACTIVE`,
`PLANNING` or `ON_HOLD` only, and always leads with **Global Project** — created on demand,
because tracking has to be able to start before anybody has set a project up. An unknown or
archived pick falls back to it rather than failing the start: unattributed time is a smaller
problem than lost time. The project's name is denormalised onto the session, so renaming or
archiving a project cannot rewrite what an old timesheet says it was for.

## Where it shows up

- **HR** — `/hr/employees/new` and `/hr/employees/:id/edit` (a page, not a dialog: the record
  is long enough to scroll and losing it to a stray click would be a real loss of work).
  Work location and hours are columns on the directory.
- **Employee portal** — `MyWorkArrangementCard` on My Attendance and My Tracker.
- **Tracker portal** — per-project time on the day panel; the consent policy picker in
  Tracker → Settings; **Tracker → Billing**, which prices each employee's active hours over a
  date range at their `billingRate`. A row with no rate is shown as _unrated_ rather than as a
  zero amount — the work was not free, nobody priced it.
- **Desktop tracker** — the day's progress bar at the top of the dashboard, the attendance
  gate and project picker above the controls, and a read-only "Your working day" card in
  Settings.
