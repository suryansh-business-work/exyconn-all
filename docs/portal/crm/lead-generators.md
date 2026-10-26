# CRM lead generators

CRM › **Lead generators** finds companies outside the CRM and files the chosen ones as CRM
companies (and contacts). Two sources:

| Page | Source | Server module |
| --- | --- | --- |
| **Google Business** (`/tools/lead-generators/google-business`, was `/tools/lead-generator`) | Google Places, with website emails | `server/src/modules/google-maps` |
| **Clutch** (`/tools/lead-generators/clutch/:runId?`) | Clutch.co B2B service providers | `server/src/modules/lead-sources/clutch` |

## Clutch

A search runs on one of two engines and is kept as a **run** (`ClutchRun`, company-scoped), so its
results can be opened, filtered and filed later without paying for the search again. A run starts
at once and finishes in the background; the page polls `clutchRun` until it is done.

| What | Clutch MCP (free) | Apify |
| --- | --- | --- |
| Company search (keyword, location, industry) | top matches (a handful) | every result page |
| Company details (profile links, or every search result) | yes | yes (`mode: profiles`) |
| Company reviews (opt-in) | yes, 10 per company | yes |
| Company portfolio (opt-in) | not offered by Clutch's server | yes |
| Phone, website, people with email | rarely | when the actor returns them |
| Cost | none | Apify usage (residential proxy) |

**Add to CRM** files the chosen companies: name, domain (from the website), phone, emails,
headquarters (location, city, country), logo, description, founded year, the Clutch profile link
in notes, `leadSource: Clutch` and origin `CLUTCH` (lead owner = who ran it). A company already in
the CRM (same domain, phone, or name + city — the matcher Google Business uses) is skipped and
named. People with an email become **contacts** of the new company; an email already on a
contact is not filed twice.

### The Clutch MCP server wrapper

`clutch.mcp.client.ts` calls Clutch's public MCP server, `https://bot.clutch.co/mcp`
(streamable HTTP, no sign-in, stateless `tools/call`). Its tools:

| Tool | Arguments | Used for |
| --- | --- | --- |
| `recommend_service_providers` | `service` (required), `industry`, `location`, `focus_areas`, `client_budget`, `hourly_rate`, `company_size` | company search |
| `get_provider_info` | `company_name` | company details (a profile link is looked up by its slug) |
| `get_service_provider_reviews` | `company_name`, `service`, `offset`, `limit` | company reviews |
| `get_service_packages` | `service`, `budget`, `location`, `page`, `limit` | not used yet |
| `send_message_to_provider` | `provider_ids`, `message`, `subject` | not used: it messages companies on the user's behalf |

Answers come as an `event: message` stream; the wrapper reads `result.structuredContent.result`
and `clutch.normalize.ts` turns providers and reviews (HTML stripped) into `ClutchCompany`.

### Apify

CRM › Lead generators › Clutch › **Set up Apify** stores the company's Apify API token (sealed with
`utils/secretBox`, only its last characters shown) and the actor to run, by default ScrapeAI's
[Clutch.co Scraper](https://apify.com/scrapeai/clutch-co-scraper) (`scrapeai/clutch-co-scraper`).
The actor is run with `run-sync-get-dataset-items` (up to 300 s) and this input
(`clutch.apify.client.ts`):

```json
{
  "search": "<keyword>",
  "mode": "companies | profiles",
  "startUrls": [{ "url": "https://clutch.co/profile/…" }],
  "includeReviews": true,
  "excludePortfolio": false,
  "maxItems": 50,
  "proxyConfiguration": { "useApifyProxy": true, "apifyProxyGroups": ["RESIDENTIAL"] }
}
```

`fromApifyItem` reads ScrapeAI's shape (`summary.*`, `serviceProvided`, `portfolio`, `reviews`)
and the flat shape other Clutch actors use (`name`, `website`, `services`, `emails`, `contacts`).
Remove the token to go back to Clutch's own server.

### Usage, permissions, MCP

- Every call is metered (`CLUTCH`, `APIFY`) and listed in Tech › Environment Variables › Usage
  history, with who and from which portal.
- Searching needs the CRM role; filing needs `Company` create; Apify settings need `Company` edit.
  Searches are rate-limited (10 a minute per person).
- The CRM MCP server (`servers/crm.server.ts`) includes `clutchTypeDefs`, so Claude can start a
  search, read a run and file companies. The settings are named `leadSourceConfig` /
  `saveLeadSourceConfig` and the token mutation `clearApifyToken`, which the MCP tool generator
  leaves out (`Config|Secret|Token`): Claude never sees or sets the Apify token.
