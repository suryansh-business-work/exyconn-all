# @exyconn/wa-flow

The WhatsApp Business demo's single source of truth: the **workflow schema** (Zod), the
**graph validator**, the **pure conversation engine**, and the **seed industries**.

| Entry | What | Who imports it |
| --- | --- | --- |
| `@exyconn/wa-flow` | schema, types, `validateGraph`, `outputHandles`, `autoLayout`, authoring helpers, rendered-message types, `toDemoBundle` (catalogue entry → runnable bundle) | portal server (compiled `dist/`, CommonJS) and the app (source) |
| `@exyconn/wa-flow/engine` | `respond`, `newChatState`, templates, dummy data, input validation | the whatsapp-demo app (source) and the server's real WhatsApp channel (compiled `dist/`) |
| `@exyconn/wa-flow/seeds` | `SEED_DEMOS` — the default industries | the portal server's boot seed |

The server loads the compiled build, so run `pnpm --filter @exyconn/wa-flow build` after
changing anything (CI and both Dockerfiles do this before the server). The compiled engine
requires `@exyconn/regex`, which ships source for every bundler and a `dist` only under the
`exyconn-compiled` export condition: the server image builds that dist and starts Node with
`--conditions=exyconn-compiled`. Locally, `tsx` and Jest read the regex source directly.

## How it fits together

```
src/seeds/<industry>/*.ts  ──(boot runOnce seed)──▶  Mongo: WhatsappDemo + WhatsappWorkflow (draft + published)
                                                        │  edited at /admin/bot-workflows (React Flow)
                                                        ▼
whatsapp-demo app  ◀── published workflows (GraphQL) ──┤
   └─ engine.respond(bundle, state, event, ctx) → replies, pushes, analytics signals, ai request
                                                        │
real WhatsApp number ◀── Meta Cloud API webhook ────────┘  (server: modules/whatsapp-demo/channel)
   └─ the same engine on the server; replies sent as WhatsApp messages, state kept per chat
```

The real number is connected at WhatsApp demo > Admin > WhatsApp number. One number demos
every industry: a new chat gets the industry list first ("industries" brings it back), and
an industry's name typed as the first message starts it straight away. Text, buttons, lists,
links, locations and contacts are sent as WhatsApp's own messages; the mock-up cards
(products, orders, tickets, documents, illustrations) go as formatted text with their option
as a reply button.

Seeds are written once as TypeScript and copied into the database the first time the server
boots with them. From then on the database is the truth: admins edit drafts and publish; the
chat runs the **published** version. A new seed industry (a key not in the database yet) is
picked up on the next boot; an existing one is never overwritten.

## Writing an industry

One folder per industry: `src/seeds/<industry>/index.ts` exports a `defineDemo({...})`, with one
file per workflow if it is long (`defineWorkflow({...})`). Register it in `src/seeds/index.ts`.
`src/seeds/healthcare/` is the complete reference — copy its shape.

```ts
import { defineDemo } from '../../author';

export const retail = defineDemo({
  key: 'retail',                       // URL slug: /whatsapp-demo/retail
  industry: 'Retail',
  business: {
    name: 'UrbanCart', tagline: 'Orders, returns and offers on WhatsApp', category: 'Shopping',
    about: '…', icon: 'store', accent: 'orange', verified: true,
    phone: '+91 …', email: '…@….example', website: 'https://….example', address: '…', hours: '…',
  },
  greeting: 'Hi {{user.firstName}} 👋 Welcome to UrbanCart.',
  menuText: 'What would you like to do?',
  menuButton: 'View options',
  workflows: [ /* one per menu entry, in menu order */ ],
});
```

Use fictional names, `.example` domains and dummy numbers. Indian context (₹, IST, Indian
addresses) is the default, but keep the copy generic enough for any client.

### A workflow

```ts
{
  key: 'track-order',                  // slug, unique within the demo
  name: 'Track my order',              // menu row title (≤ 24 chars)
  description: 'Live status and delivery slot', // menu row description (≤ 72 chars)
  keywords: ['track', 'where is my order', 'order status'], // typed text that jumps here
  start: 'ask',                        // optional, defaults to the first node
  nodes: [
    { id: 'ask', type: 'input', data: { prompt: 'Please type your order number.', var: 'orderNo', kind: 'text' }, next: 'status' },
    { id: 'status', type: 'buttons', data: { text: 'Order {{orderNo}} is out for delivery.', buttons: [
        { id: 'ok', title: 'Thanks' }, { id: 'agent', title: 'Talk to us' } ] },
      next: { ok: 'bye', agent: 'human' } },
    { id: 'human', type: 'handoff', data: { agentName: 'Priya (UrbanCart)', text: 'Hi {{user.firstName}}, I can help.' }, next: 'bye' },
    { id: 'bye', type: 'end', data: { text: 'Anything else?', showMenu: true } },
  ],
}
```

`next` is authoring sugar: a string wires the node's single `next` output; a map wires named
outputs (`{ buttonId: 'target' }`). `toWorkflowDef` turns it into React Flow edges and lays the
graph out. Node ids must be unique within the workflow.

### Node types

Every node's `data` may also carry `set` (variables set on entry), `complete: true` (reaching
it completes the workflow for analytics) and `note` (editor-only).

| type | data | outputs (`next` keys) |
| --- | --- | --- |
| `text` | `text` | `next` |
| `notice` | `text` — centred system notice, not a bubble | `next` |
| `buttons` | `header?`, `text`, `footer?`, `buttons[1–3]: { id, title ≤20, set? }` | one per button id |
| `list` | `header?`, `text`, `footer?`, `button` (sheet button ≤20), `sections[]: { id, title, rows[≤10]: { id, title ≤24, description? ≤72, set? } }`, `dynamic?` | one per row id, plus `pick` for dynamic rows |
| `cta` | `header?`, `text`, `footer?`, `actions[1–2]`: `{kind:'url',title,url}` / `{kind:'call',title,phone}` / `{kind:'calendar',title,event:{title,start,durationMin,location?}}` | `next` (continues straight on) |
| `image` | `image: { icon, accent, title?, subtitle? }`, `caption?` | `next` |
| `document` | `document: { fileName, fileType PDF/XLSX/DOCX, pages, sizeKb, preview: { title, subtitle?, sections[], footer? } }`, `caption?` | `next` |
| `location` | `location: { name, address, lat, lng }`, `caption?` | `next` |
| `contact` | `contact: { name, phone, role?, organisation? }` | `next` |
| `product` | `product: { id, title, subtitle?, price, mrp?, badge?, image, buttonTitle?, set? }` | the product id (when `buttonTitle`), else `next` |
| `carousel` | `text?`, `cards[1–10]`: products, each with `buttonTitle` | one per card id |
| `ticket` | `ticket: { ticketId, title, subtitle?, fields[≤8]: {label,value}, qrData }` — drawn with a real QR code | `next` |
| `order` | `order: { orderId, title, items[]: {id,name,qty,price}, adjustments?[]: {id,label,amount}, status: pending/paid, payTitle? }` | `pay` (pending + payTitle), else `next` |
| `input` | `prompt?`, `var`, `kind` (name/phone/email/date/pincode/number/text), `error?`, `past?` (date not in future) | `next` (valid answer); an invalid one re-asks |
| `ai` | `prompt?`, `intents[]: {id, description}`, `entities[]: {name, kind, description}`, `retry?` | one per intent id, plus `fallback` (required) |
| `condition` | `cases[1–6]: { id, var, op (eq/neq/contains/empty/notEmpty/gt/lt), value? }` | one per case id, plus `else` |
| `delay` | `ms` — extra "typing…" before the next message | `next` |
| `reminder` | `afterMs` (≥ 1000), `label?` — schedules a push | `next` (now), `later` (played when due, as a new message with a toast + unread badge) |
| `handoff` | `agentName`, `text` — "<agent> joined" notice + a message from them | `next` |
| `jump` | `workflowKey` — start another workflow of the same demo | — |
| `end` | `text?`, `showMenu` — completes the workflow | — |

Prices (`price`, `mrp`, order `price`/`amount`) are rupees as a number, or a `{{var}}` template
holding one. `cta` calendar `start` is epoch ms as a template, e.g. `'{{slot}}'`.

`dynamic` list rows:
- `{ kind: 'days', count: 7, skipSundays: true, var: 'day' }` → rows for the next 7 days; picking one sets `day` (epoch ms) and `dayLabel`.
- `{ kind: 'slots', dayVar: 'day', from: 9, to: 17, stepMin: 30, take: 8, var: 'slot' }` → free slots that day; sets `slot` and `slotLabel`.

Wire their `pick` output. Static sections may sit beside them (e.g. a "Different week" row).

### Variables and templates

Every customer-facing string is a template:

- `{{name}}` — a variable set by `set`, an option's `set`, an `input` node or an `ai` entity.
- `{{user.firstName}}`, `{{user.fullName}}`, `{{user.email}}`, `{{user.phone}}` — **the real
  signed-in portal user** (phone may be empty). Greet with the first name; offer the full name
  and phone as the "patient/customer details" the bot confirms. Everything else stays dummy.
- Filters: `{{fee|money}}` (₹ formatted), `{{slot|time}}`, `{{day|day}}` ("Mon, 6 Oct"),
  `{{dob|date}}`, `{{code|upper}}`, `{{x|lower}}`. Date/time filters take epoch ms.

`set` values may be templates or helpers (deterministic per chat, so a reload shows the same):
`$id:CC` → `CC-4KQ7W2`, `$price:650` / `$price:650:15` (±15%), `$int:1:9`, `$pick:a|b|c`,
`$days:2` (local midnight two days ahead, epoch ms), `$now`.

### Translation

Write every string in English: it is the `@exyconn/i18n` key. The engine translates each
template **before** filling it in, so the catalogue sees "Hi {{user.firstName}}" once, never a
sentence with a name in it. Do not bake values into strings yourself — use variables. `set`
values and variable contents are not translated.

### Limits that will fail validation

Buttons 1–3 with titles ≤ 20; list rows ≤ 10 per section and titles ≤ 24; CTA ≤ 2 actions;
every button / row / card / `pay` / `fallback` / `input` output wired; a `jump` to an existing
workflow key; unique node ids. `validateGraph(graph, workflowKeys)` lists them all — errors
block Publish, warnings (unreachable nodes, dead ends) do not. Check a new industry with:

```sh
pnpm --filter @exyconn/wa-flow build && node -e "
const w=require('./packages/wa-flow/dist'); const {SEED_DEMOS}=require('./packages/wa-flow/dist/seeds');
for (const d of SEED_DEMOS) { const keys=d.workflows.map(x=>x.key);
  d.workflows.forEach((s,i)=>{ const def=w.toWorkflowDef(s,i); w.workflowSchema.parse(def);
    console.log(d.key, s.key, w.validateGraph(def.graph, keys)); }); }"
```

### Icons and accents

`icon` and `accent` are names from `src/visuals.ts` (`ICON_KEYS`, `ACCENT_KEYS`); the app maps
them to MUI icons and colour tokens. Need a new icon? Add the key there and its MUI icon in the
app's `src/components/wa/icons.ts`.

## The engine

```ts
import { respond, newChatState } from '@exyconn/wa-flow/engine';

const state = newChatState('healthcare', user.id);           // seeded per viewer
const r = respond(bundle, state, { type: 'start' }, ctx);    // greeting + menu
// r.sent (the customer's bubble), r.replies[{ message, typingMs }], r.scheduled (pushes),
// r.signals (analytics), r.ai (free text for the server to read), r.state (persist it)
```

Events: `start`, `choice` (a tapped `RenderedOption` + the quoted text), `text`, `push` (a due
`PendingPush`), `ai` (the server's reading of a pending `AiRequest`, `null` on failure).
`ctx` carries `now`, the `user`, `t`, locale-bound `format`ters, whether `ai` is available, and
`typingScale` (reduced motion).

Free text is routed in this order: a menu word (`menu`, `hi`, `restart`…) → the menu; an
awaited `input` node → validated and stored; an awaited `ai` node → an `ai` request; a workflow
keyword → that workflow; otherwise an `ai` router request (when available) or the menu with a
"didn't catch that".
