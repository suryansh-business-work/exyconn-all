# @exyconn/whatsapp-demo-server

The WhatsApp demo's server code (demos.exyconn.com/whatsapp-demo): demo profiles and
workflows, sessions and analytics, the real WhatsApp channel (Meta Cloud API webhook) and the
demo visitor pass that opens every demo.

It is not a process of its own. The portal server (`exyconn-portal/server`) runs it in the
same process, so it shares the portal's tenancy, auth, models, audit and email:

- The code imports portal internals by relative path (`../../../../exyconn-portal/server/src/…`),
  and the portal server imports it the same way (`graphql/index.ts`, `app.ts`, `server.ts`,
  `middleware/auth.ts`).
- The portal server's build compiles it: `tsconfig.build.json` has the repository as its
  `rootDir`, so `dist/` mirrors the repository and the entry is
  `dist/exyconn-portal/server/src/server.js`.
- Its tests live with the portal server's (`exyconn-portal/server/__tests__`), whose jest
  config lists this `src` as a root.

| Folder     | What                                                                            |
| ---------- | ------------------------------------------------------------------------------- |
| `src/`     | Demos, workflows, sessions, stats, analytics and their GraphQL schema           |
| `channel/` | The real WhatsApp number: webhook, inbound queue, replies, reminders and chats  |
| `visitor/` | Email-and-code sign-in for demo visitors (`x-demo-visitor`), used by every demo |
