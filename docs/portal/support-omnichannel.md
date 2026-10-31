# Support: one queue for every channel

The support desk (support.exyconn.com, and IT's helpdesk for the IT category) works one queue,
`SupportTicket`, whichever door a request came in by. The ticket's `channel` says which.

| Channel    | How the ticket is filed                                                                   | Where the conversation lives                                              |
| ---------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `PORTAL`   | the employee desk or the public form on status.exyconn.com/help                           | the ticket's own replies                                                  |
| `AGENT`    | an agent raises it in the console                                                         | the ticket's own replies                                                  |
| `EMAIL`    | the inbound mail poller (`support/inbound-mail.ts`); replies quoting the reference thread | the ticket's own replies                                                  |
| `CHAT`     | every website chat opens one (`website-chat/chat.session.ts`)                             | the chat session; `ChatSession.ticketId` links it                         |
| `WHATSAPP` | the first message to the WhatsApp number, and again after the last one was resolved       | the WhatsApp chat; `WhatsappChat.ticketId` links it (`channel.ticket.ts`) |

Every route goes through `fileClientTicket`, so a ticket is referenced, attributed to a client and
measured against its SLA the same way. Chats are **linked, not copied**: `supportTicketSource`
reads the live chat behind a `CHAT` or `WHATSAPP` ticket (contact, status, last activity and, for a
website chat, a link to Website > Chatbot > Sessions). Nothing a WhatsApp sender typed is stored,
and their number is shown masked. The console has quick filters for Website chat and WhatsApp, and
the overview breaks tickets down by channel.

## AI suggested reply

`suggestSupportReply(ticketId)` drafts the next public reply from the ticket, its public thread
(internal notes stay out), the best three published knowledge-base articles (text search on the
subject and description) and the active canned replies of the ticket's category. It runs through
`runAssist`, so it needs an active OpenAI key (Tech > Environment Variables), counts against the AI
spend limit and appears in AI history as "Support suggested reply". The draft lands in the reply
box for the agent to edit; nothing is sent automatically.

## Customer satisfaction (CSAT)

- The first time a **customer** ticket (`requesterType: CLIENT`) with an email address moves to
  RESOLVED or CLOSED, `sendCsatSurvey` emails the `support-csat` template (seeded by
  `ensureEmailDefaults`, edited in Tech > Email). Employees and WhatsApp requesters are not asked.
- The link opens `status.exyconn.com/help/rate/<token>` (`SUPPORT_CSAT_URL` overrides the base).
  Only the SHA-256 of the token is stored; the link takes one answer, 1 to 5 plus an optional
  comment, and both public operations are rate-limited per IP.
- The rating is stored on the ticket (`csatScore`, `csatComment`, `csatRatedAt`) and shown on the
  ticket. `supportSlaSummary` adds `csatSent`, `csatResponses`, `csatAverage` and `csatPercent`
  (share of 4 and 5 ratings); the console and overview show the percentage.

All of this is on the Support MCP server (`support.omnichannel.typeDefs.ts`).
