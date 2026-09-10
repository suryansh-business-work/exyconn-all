# The shared approval queue

Every module used to own its decisions outright: HR approved leave on the HR screen,
finance cleared claims on the finance screen, a manager reviewed off-computer time inside
the tracker. That is still true — but a manager had to remember which of sixteen portals a
decision was hiding in, and nothing anywhere could answer "what is waiting on me?".

`myApprovals` answers it. One queue, every module, on every portal.

## It is a view, not a table

There is **no approvals collection**. An approval lives in the collection that owns the
decision — a leave request *is* the leave request — and the queue reads through to them.
A central copy would be a second version of the truth, and the two would part company the
first time anything decided a claim without going through the queue.

So the queue is a registry of sources:

```
myApprovals ──┬─ LeaveRequest       status: PENDING
              ├─ ExpenseClaim       status: SUBMITTED
              ├─ EmployeeRequest    status: PENDING
              └─ TrackerManualEntry status: PENDING
```

Each source is one descriptor in
[`approvals.registry.ts`](../../exyconn-portal/server/src/modules/approvals/approvals.registry.ts):
where its pending rows are, how to render one, and — the important half — **how to decide
one**.

## Deciding delegates; it never reimplements

`decideApproval` dispatches to the owning module's own service:

| Source | Decided through |
| --- | --- |
| `LEAVE` | `hrResolvers.Mutation.setLeaveStatus` |
| `EXPENSE` | `setExpenseClaimStatus` |
| `REQUEST` | `requestsResolvers.Mutation.decideEmployeeRequest` |
| `MANUAL_TIME` | `trackerManualService.review` |

This is not tidiness. Approving leave means debiting a leave balance; writing
`status: 'APPROVED'` from the queue would approve leave that never left anybody's
entitlement, and the employee would never be told. The queue is a second **door** onto a
decision, never a second implementation of it.

## Who sees what

Per source, in `scopeFor`:

1. **ADMIN** — everything.
2. **A role holder** (HR for leave, FINANCE for claims, …) — everything in that source,
   provided the permission matrix still leaves them `APPROVE` on it. An administrator who
   takes APPROVE away from a role does not leave that role a queue full of buttons the
   server would refuse.
3. **A manager**, where the source allows it — only their own direct reports' rows. This
   path is deliberately *not* measured against the matrix: a manager acting through the
   reporting line is not acting through the module's role at all, exactly as
   `assertApprovePermission` already reasons.
4. **Anyone else** — the source does not appear at all. Not a zero count: absent.

`kind` narrows the rows and nothing else. Counts stay the caller's whole backlog, because
a filter that also shrank its own totals would tell a manager they were finished when they
were not.

## Where it shows up

- `/approvals` — mounted by `PortalApp`, so it exists on **every** portal.
- `/me/approvals` — the sidebar entry under My Workspace.
- The topbar badge (`ApprovalsBell`), which hides itself entirely for somebody who
  approves nothing.

## Adding a source

One descriptor in `APPROVAL_SOURCES`, and a `decide` that calls the module's existing
service. Purchase orders, invoices, contracts and deployments each become an entry here
rather than another bespoke approvals screen — which is the whole point of the registry.
