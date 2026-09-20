# Search, and the command palette

The topbar used to hold an autocomplete over the list of modules. It could take somebody to
Finance; it could never take them to an invoice. Nothing in this portal could find a record
by name — a ticket reference, a risk, a colleague — without knowing which screen it lived on
first.

## One question, asked of every module

`search(query)` asks each module that the caller's roles can open, in parallel, and returns
only the groups that matched:

```
search("acme") ──┬─ Invoices          INV-0042 · Acme Ltd · SENT
                 ├─ Companies         Acme Ltd · acme.com
                 ├─ Deals            Acme rollout · NEGOTIATION
                 └─ Support tickets   EXY-4KQ7W2 · Acme cannot sign in
```

A module declares a provider: which fields a query is matched against, how a row reads, and
where it opens.

```ts
{
  key: 'invoices',
  label: 'Invoices',
  roles: [ROLES.FINANCE],
  find: (query, limit) => …,
}
```

The declarations live together in `modules/search/providers.ts` rather than one per module.
They are twenty near-identical "match these fields, name the row, link to the screen"
statements, and keeping them in one file is what makes it obvious when a new module has been
forgotten.

## The rules it follows

- **Roles are the module's own.** A provider names the roles that guard the module's
  screens, so the search box can never become a way to read a module somebody cannot open.
  ADMIN passes everything, as it does everywhere else.
- **Tenancy is not the provider's problem.** Every query goes through the mongoose scope
  plugin, so a provider cannot accidentally reach another company's records.
- **Typing is text, never a pattern.** A query is escaped before it reaches a regex, so
  `.*` finds nothing rather than everything.
- **Bounded.** Five rows per module, minimum two characters, eighty characters at most. This
  answers "take me to that record", not "report on it".
- **One failure is one group.** A provider that throws loses its own group and is logged;
  the answer still arrives.

Because the matching is unanchored — people search for the middle of a name or a number —
it cannot use an index. That is why the limits are small. The one exception is the knowledge
base, which has a real Mongo text index of its own.

## The palette

`Cmd+K`, or `Ctrl+K` off a Mac, from anywhere in any portal. The topbar button says so,
because the point of a palette is that people stop reaching for the mouse.

- Modules are matched **in the browser**, so the first keystroke shows something without
  waiting for a round trip; records arrive behind them.
- The server call is debounced by 200ms: typing "invoice" should cost one search, not seven.
- Arrow keys walk one flat list while the reader sees groups; Enter opens the row.
- Each result works out which micro-frontend it belongs to from its own path
  (`appForPath`), so an invoice found from the HR portal opens in Finance.
- The box is empty every time it opens. The last thing somebody looked for is rarely the
  next thing.

## Where to look

| File                                       | What it is                                      |
| ------------------------------------------ | ----------------------------------------------- |
| `modules/search/search.registry.ts`        | The provider contract and the role filter.      |
| `modules/search/search.text.ts`            | Escaping, the length bounds, the field matcher. |
| `modules/search/search.service.ts`         | Runs the providers and groups the answer.       |
| `modules/search/providers.ts`              | Every module's declaration.                     |
| `packages/shell/src/layout/CommandPalette` | The palette, its results list and the shortcut. |

## Adding a module to it

Add one entry to `DECLARATIONS`: the fields worth matching, a title and subtitle a person
would recognise, the link, and the roles that already guard the module. If the link is a
path no app claims, `appForPath` returns nothing and the palette drops the row rather than
guessing — so check the path is one the registry knows.
