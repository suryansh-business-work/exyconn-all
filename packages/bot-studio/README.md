# @exyconn/bot-studio

Everything the conversation bots built on [`@exyconn/wa-flow`](../wa-flow) share in the
browser. Consumed as TypeScript source (no build step).

| Entry | What | Used by |
| --- | --- | --- |
| `@exyconn/bot-studio/runtime` | The chat loop on the engine (`useChatRuntime`, reply pacing, per-viewer storage), the published catalogue per channel (`useCatalog(channel)`), AI parses, formatters, analytics (`useDemoAnalytics`) | WhatsApp demo, website chat widget |
| `@exyconn/bot-studio/studio` | The bot studio's screens for one channel: workflow list + React Flow editor, analytics, sessions; plus the generic `FlowWorkspace` / `useGraphEditor` for a stored graph | WhatsApp demo `/admin`, Agents > Website chat agent, Agents > Calling bot > Call flows |
| `@exyconn/bot-studio/widget` | The website chat widget (`ChatWidget`, `useLiveWidgetChat`) and its in-memory `WidgetPreview` | website chat agent demo, the studio's preview for website bots and call-flow rehearsals |
| `@exyconn/bot-studio/icons` | `WA_ICONS`: the MUI icon behind each `ICON_KEYS` name | every skin and the editor |
| `@exyconn/bot-studio/shared` | Accent tints, `FormattedText` (`*bold*` markup), `.ics` calendar files | every skin |

## Channels

A demo's `channel` (`whatsapp` or `website`) decides where its bot talks. Both run the same
engine and the same workflows; only the skin differs. The server filters every catalogue,
demo list, stats and session query by channel (WhatsApp when a client names none).

## Hosting the studio

Wrap the screens in a `StudioProvider` naming the channel and the host's routes:

```tsx
const STUDIO: StudioConfig = {
  channel: 'website',
  name: 'Website chat agent',                     // page titles: "{name} analytics"
  workflowsPath: '/agents/website-bot/bot-workflows', // editor: `${workflowsPath}/<id>`
  renderPreview: (bundle, start) => <WidgetPreview bundle={bundle} startWorkflow={start} />,
  forbidden: <DemosForbidden />,
};

<StudioProvider config={STUDIO}>
  <Routes>
    <Route path="bot-workflows" element={<WorkflowListPage />} />
    <Route path="bot-workflows/:workflowId" element={<WorkflowEditorPage />} />
  </Routes>
</StudioProvider>;
```

Keep `config` stable (module-level or memoised). A graph that is not a chat workflow (a
calling bot's call flow) uses `FlowWorkspace` + `useGraphEditor` inside a `FlowProvider`, with
`types={VOICE_NODE_TYPES}` to limit the palette.

## Storage

The WhatsApp chats and the website widget share the demos origin, so the widget keeps its
saved chats under `website:<viewer id>`; the WhatsApp demo keeps `<viewer id>`.
