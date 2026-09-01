import type { ToolDetailsMap } from './types';

/** Detail content for the "domain-network" tool category. Keyed by tool id from toolsData. */
export const domainNetworkToolDetails: ToolDetailsMap = {
  'dns-lookup': {
    longDescription: [
      'The DNS Lookup tool queries the Domain Name System for any domain and returns its records in one place. Pick a specific record type — A, AAAA, CNAME, MX, TXT, NS, SOA, or SRV — or choose ALL to fetch every type in a single request. Each record group is shown in its own expandable section with the raw resolver output, so you see exactly what the DNS returns, not a simplified summary.',
      'Lookups run on the Exyconn server using live DNS resolution, so results reflect what public resolvers currently see rather than your browser or ISP cache. That makes the tool reliable for verifying a DNS change after you update records at your registrar or DNS host, and for comparing what you configured against what has actually propagated.',
      'It is built for developers pointing domains at new hosting, sysadmins debugging resolution problems, and email admins confirming MX and TXT setup. Every result can be copied or downloaded as JSON, which is handy for attaching evidence to a support ticket or keeping a before/after snapshot of a migration.',
    ],
    features: [
      'Query A, AAAA, CNAME, MX, TXT, NS, SOA, and SRV record types',
      'ALL mode fetches every record type for a domain in one request',
      'Live server-side resolution — no stale browser or ISP cache',
      'Each record type shown in its own expandable accordion with raw values',
      'Copy the full result as JSON with one click',
      'Download results as a JSON file for tickets and migration records',
    ],
    useCases: [
      'Verify DNS changes have propagated after switching hosting providers',
      'Debug a site that resolves for some users but not others',
      'Confirm MX and TXT records before an email platform cutover',
      'Snapshot a domain’s full DNS state before a migration',
      'Check SOA serial numbers to see if a zone update was published',
    ],
    howTo: [
      'Enter the domain you want to inspect, e.g. example.com',
      'Choose a record type from the dropdown, or keep ALL for every type',
      'Click "Lookup DNS" and wait a moment for resolution',
      'Expand each record-type section to read the returned values',
      'Use the copy or download buttons to save the results as JSON',
    ],
    faqs: [
      {
        question: 'Which DNS record types can I look up?',
        answer: 'A, AAAA, CNAME, MX, TXT, NS, SOA, and SRV. Select ALL to query every one of them for the domain in a single lookup.',
      },
      {
        question: 'Why do results differ from what I see on my own machine?',
        answer: 'The lookup runs from the Exyconn server, not your computer, so it bypasses your local and ISP caches. If your machine shows old values, your resolver is still caching the previous records.',
      },
      {
        question: 'How long does a DNS change take to appear here?',
        answer: 'It depends on the record’s TTL. Once the authoritative zone is updated and the old TTL expires, the new value shows up — often within minutes, sometimes up to 48 hours.',
      },
      {
        question: 'Can I look up a subdomain instead of a root domain?',
        answer: 'Yes. Enter the full hostname such as api.example.com and the lookup resolves records for that exact name.',
      },
      {
        question: 'Is the domain I enter stored anywhere?',
        answer: 'The domain is sent to the Exyconn server only to perform the resolution and return the result. No account is needed and results are not published anywhere.',
      },
    ],
    keywords: [
      'dns lookup',
      'dns checker',
      'check dns records',
      'a record lookup',
      'dns record lookup online',
      'nslookup online',
      'dig online',
      'dns propagation check',
      'mx txt ns lookup',
    ],
    metaDescription:
      'Free online DNS lookup tool. Query A, AAAA, CNAME, MX, TXT, NS, SOA, and SRV records for any domain and inspect the raw results instantly.',
  },

  'whois-lookup': {
    longDescription: [
      'The WHOIS Lookup tool retrieves live registration data for any domain using the modern RDAP protocol, with a classic WHOIS fallback for registries that RDAP does not cover. You get the registrar, registrant (where not privacy-protected), domain status codes, authoritative nameservers, and the full event timeline including registration and expiration dates.',
      'Results come straight from registry data queried at the moment you ask, not from a cached database, so the dates and status codes you see are current. Status codes such as clientTransferProhibited are shown as chips, and each lifecycle event is listed with its date, which makes it easy to read a domain’s history at a glance.',
      'Use it before buying a domain on the aftermarket, when investigating who operates a site, or when auditing your own portfolio’s renewal dates. The complete raw RDAP response is included in the JSON download for cases where you need every field the registry returns.',
    ],
    features: [
      'Live RDAP query with automatic classic-WHOIS fallback',
      'Registrar and registrant names where the registry discloses them',
      'EPP status codes (e.g. clientTransferProhibited) shown as chips',
      'Registration and expiration events with exact dates',
      'Authoritative nameserver list for the domain',
      'Full raw registry response available via JSON download',
    ],
    useCases: [
      'Check who registered a domain before making a purchase offer',
      'Verify a domain’s expiry date and lock status before a transfer',
      'Investigate a suspicious website’s registration history',
      'Confirm your own domains show the correct registrar and nameservers',
    ],
    howTo: [
      'Type the domain name into the input field, e.g. example.com',
      'Click "Lookup" and wait for the registry response',
      'Read the status chips, registrar, registrant, and nameservers',
      'Check the Events section for registration and expiry dates',
      'Download the JSON if you need the complete raw registry record',
    ],
    faqs: [
      {
        question: 'What is the difference between WHOIS and RDAP?',
        answer: 'RDAP is the structured, JSON-based successor to the plain-text WHOIS protocol. This tool queries RDAP first for reliable parsing and falls back to a TCP WHOIS query when a registry has no RDAP endpoint.',
      },
      {
        question: 'Why does the registrant show as "Private"?',
        answer: 'Most registrars apply privacy protection and GDPR redaction, so the registry withholds personal details. In that case only the registrar, dates, status, and nameservers are public.',
      },
      {
        question: 'Does this work for all domain extensions?',
        answer: 'It works for gTLDs like .com, .net, and .org and for the many ccTLDs with RDAP support. A few country registries expose limited data, in which case fewer fields are returned.',
      },
      {
        question: 'Can I see when a domain expires?',
        answer: 'Yes. The Events section lists the expiration event with its exact date, alongside the original registration date and any recent changes.',
      },
      {
        question: 'Is there a lookup limit or account requirement?',
        answer: 'No account is needed. Lookups are free; heavy automated querying may be rate-limited by the upstream registries themselves.',
      },
    ],
    keywords: [
      'whois lookup',
      'domain whois',
      'whois checker',
      'domain owner lookup',
      'rdap lookup',
      'domain registration info',
      'who owns this domain',
      'domain registrar lookup',
    ],
    metaDescription:
      'Free WHOIS lookup with live RDAP data. See registrar, registration and expiry dates, status codes, and nameservers for any domain in seconds.',
  },

  'ip-lookup': {
    longDescription: [
      'The IP Address Lookup tool returns geolocation and network ownership details for any public IP address. Enter an IPv4 or IPv6 address and get the country, region, city, approximate coordinates, timezone, ISP, owning organization, and autonomous system (AS) information in a clean key-value table.',
      'The lookup is performed by the Exyconn server against a live IP intelligence database, so you get current allocation data rather than a stale snapshot. That matters when investigating traffic, because IP blocks are regularly reassigned between providers and regions.',
      'It is useful for anyone reading server logs, configuring geo-based rules, or triaging abuse reports: paste the address from your log line and immediately see which network it belongs to and roughly where it originates. Results can be copied or downloaded as JSON for inclusion in incident notes.',
    ],
    features: [
      'Country, region, city, and approximate coordinates for any public IP',
      'ISP, organization, and AS number identification',
      'Timezone of the IP’s registered location',
      'Works with both IPv4 and IPv6 addresses',
      'Results in a readable key-value table, plus JSON copy/download',
    ],
    useCases: [
      'Identify where suspicious log-in attempts in your server logs come from',
      'Verify a CDN or VPN exit node is located where you expect',
      'Triage abuse complaints by finding the ISP that owns an address',
      'Check which network a customer’s reported IP belongs to when debugging geo-blocking',
    ],
    howTo: [
      'Enter the IP address in the input field, e.g. 8.8.8.8',
      'Click "Lookup IP"',
      'Review the location, ISP, organization, and AS details in the table',
      'Copy or download the JSON result for your records',
    ],
    faqs: [
      {
        question: 'How accurate is IP geolocation?',
        answer: 'Country-level accuracy is very high; city-level is an estimate based on where the ISP registers the block. It identifies the network’s service area, not a person’s street address.',
      },
      {
        question: 'Can I look up private addresses like 192.168.1.1?',
        answer: 'No. Private and reserved ranges (10.x, 172.16–31.x, 192.168.x) are not routed on the internet and have no public location or ownership data.',
      },
      {
        question: 'What is an AS number?',
        answer: 'An autonomous system number identifies the network operator that announces the IP block on the internet, such as an ISP, cloud provider, or large enterprise. It is the most reliable way to attribute an address.',
      },
      {
        question: 'Why does a VPN user’s IP show a different country?',
        answer: 'Geolocation reflects where the IP block is registered and routed. A VPN or proxy shows its exit server’s location, not the user’s.',
      },
      {
        question: 'Is my searched IP address logged or shared?',
        answer: 'The address you enter is used only to run the lookup and return the result to you. No account is required.',
      },
    ],
    keywords: [
      'ip lookup',
      'ip address lookup',
      'ip geolocation',
      'find ip location',
      'whose ip is this',
      'ip isp lookup',
      'asn lookup',
      'ip address checker',
    ],
    metaDescription:
      'Free IP address lookup. Get country, city, ISP, organization, ASN, and timezone for any IPv4 or IPv6 address with instant geolocation details.',
  },

  'reverse-ip-lookup': {
    longDescription: [
      'The Reverse IP Lookup tool performs a reverse DNS (PTR) query on an IP address and returns the hostnames registered for it. Where a normal DNS lookup turns a name into an address, this does the opposite: it tells you what name the owner of the IP has published for that address.',
      'The query runs on the Exyconn server against live DNS, and the result shows every PTR hostname found along with a count. If the address has no reverse record, the tool says so explicitly instead of returning an empty page — itself a useful signal, since well-run mail servers are expected to have matching reverse DNS.',
      'Mail administrators use it to confirm a sending server’s PTR record matches its HELO name, network engineers use it to label addresses in traffic captures and traceroutes, and security analysts use it to identify infrastructure behind IPs seen in logs.',
    ],
    features: [
      'Live reverse DNS (PTR) resolution for any public IP address',
      'Lists every hostname registered for the address, with a count',
      'Clear "no reverse DNS records found" message when none exist',
      'Runs from the Exyconn server, bypassing local resolver caches',
      'JSON copy and download for reports and tickets',
    ],
    useCases: [
      'Verify your mail server’s PTR record before going live to protect deliverability',
      'Identify the server behind an unfamiliar IP found in access logs',
      'Label hops in a traceroute with human-readable hostnames',
      'Check that a hosting provider set up the reverse DNS you requested',
    ],
    howTo: [
      'Enter the IP address to check, e.g. 8.8.8.8',
      'Click "Reverse Lookup"',
      'Read the list of hostname(s) returned for the address',
      'Copy or download the result as JSON if needed',
    ],
    faqs: [
      {
        question: 'What is a PTR record?',
        answer: 'A PTR record maps an IP address back to a hostname — the mirror image of an A record. It lives in a special reverse DNS zone managed by whoever controls the IP block.',
      },
      {
        question: 'Why does my IP show no reverse DNS records?',
        answer: 'The owner of the IP block — usually your ISP or hosting provider — has not created a PTR record. You normally have to request it from them; you cannot set it at your domain’s DNS host.',
      },
      {
        question: 'Does this list every website hosted on an IP?',
        answer: 'No. It returns the PTR hostnames published in reverse DNS, typically one per address. Shared hosting servers with hundreds of sites usually publish a single generic hostname.',
      },
      {
        question: 'Why does reverse DNS matter for email?',
        answer: 'Most receiving mail servers check that a sender’s IP has a PTR record, and many also verify it matches the server’s hostname. Missing or generic reverse DNS is a common cause of rejected or spam-foldered mail.',
      },
    ],
    keywords: [
      'reverse ip lookup',
      'reverse dns lookup',
      'ptr record lookup',
      'ip to hostname',
      'ip to domain',
      'check ptr record',
      'reverse dns checker',
    ],
    metaDescription:
      'Free reverse IP lookup. Resolve the PTR record for any IP address to find its registered hostnames — useful for mail server and log audits.',
  },

  'cname-checker': {
    longDescription: [
      'The CNAME Record Checker looks up the canonical-name record for a hostname and shows you exactly where it points. Enter a name like www.example.com or shop.example.com and the tool returns the CNAME target — or tells you plainly that no CNAME exists, which usually means the name uses a direct A/AAAA record instead.',
      'The lookup runs live on the Exyconn server, so it reflects the current state of DNS rather than what your browser has cached. A clear "CNAME Found" or "No CNAME" chip gives you the answer at a glance, with the full target chain listed below it.',
      'CNAMEs are how most third-party services attach to your domain — CDNs, site builders, email marketing tools, and verification flows all ask you to "point a CNAME" at them. This checker is the fastest way to confirm you created the record correctly and that it has propagated, before you sit waiting on the service’s own verification step.',
    ],
    features: [
      'Instant CNAME resolution for any hostname',
      'Clear "CNAME Found" / "No CNAME" verdict chip',
      'Shows the full target the alias points to',
      'Live server-side lookup, unaffected by local DNS caches',
      'JSON copy and download of the raw result',
    ],
    useCases: [
      'Confirm a www or shop subdomain points at your site builder or storefront',
      'Verify the CNAME a SaaS vendor asked you to add before clicking their "verify" button',
      'Check a CDN alias (e.g. cdn.example.com) resolves to the provider’s hostname',
      'Debug why a custom domain shows a certificate or "domain not configured" error',
    ],
    howTo: [
      'Enter the hostname to check, e.g. subdomain.example.com',
      'Click "Check CNAME"',
      'Read the verdict chip and the target record(s) shown below',
      'If no CNAME appears yet, wait for DNS propagation and re-check',
    ],
    faqs: [
      {
        question: 'What is a CNAME record?',
        answer: 'A CNAME is an alias: it says "this hostname is really that other hostname". Resolvers then look up the target’s records, which lets a provider change IPs without you touching your DNS.',
      },
      {
        question: 'Why does the root domain show "No CNAME"?',
        answer: 'The DNS standard forbids a CNAME at a zone apex (example.com itself) because it must coexist with SOA and NS records. Roots use A/AAAA or provider-specific ALIAS/ANAME records, which resolve as A records here.',
      },
      {
        question: 'I added the CNAME but the checker doesn’t see it. Why?',
        answer: 'Either the record was added on the wrong host label, or the previous record’s TTL has not expired yet. Double-check the name matches exactly and re-test after the TTL window.',
      },
      {
        question: 'Can a hostname have both a CNAME and other records?',
        answer: 'No. A name with a CNAME may carry no other record types. If a service asks for a CNAME plus TXT on the same name, use a different label or the provider’s alternative verification method.',
      },
    ],
    keywords: [
      'cname checker',
      'cname lookup',
      'check cname record',
      'cname record lookup online',
      'verify cname',
      'dns cname test',
      'subdomain cname check',
    ],
    metaDescription:
      'Free CNAME record checker. Verify where a subdomain points and confirm DNS setup for CDNs, email tools, and site builders in one click.',
  },

  'mx-record-checker': {
    longDescription: [
      'The MX Record Checker lists the mail exchange records for a domain — the servers that receive its email — in a table sorted by priority. Enter a domain and you immediately see how many MX records exist, which hosts they point to, and the priority number that decides the order receiving attempts follow.',
      'The lookup is performed live on the Exyconn server against public DNS, so the result is what any sending mail server in the world would see right now. That makes it the definitive check after switching email providers: if the table shows your new provider’s hosts and nothing else, the cutover is done.',
      'It is aimed at anyone setting up Google Workspace, Microsoft 365, Zoho, or a self-hosted mail server, and at admins debugging bounced mail. A domain with no MX records, a stale record from an old provider, or wrong priorities are all visible at a glance.',
    ],
    features: [
      'Lists all MX records with their exchange hostnames',
      'Shows each record’s priority so you can verify failover order',
      'Record count chip for a quick sanity check',
      'Live server-side DNS resolution — no cached answers',
      'JSON copy and download for support tickets',
    ],
    useCases: [
      'Verify MX records after migrating to Google Workspace or Microsoft 365',
      'Debug "mail delivery failed" bounces caused by wrong or missing MX records',
      'Confirm an old provider’s MX entries were fully removed after a switch',
      'Check a customer or partner domain can actually receive email before a campaign',
    ],
    howTo: [
      'Enter the domain whose mail setup you want to verify',
      'Click "Check MX Records"',
      'Review the table of exchange hosts and their priorities',
      'Confirm the hosts match your email provider’s documentation',
    ],
    faqs: [
      {
        question: 'What does the priority number mean?',
        answer: 'Lower numbers are tried first. Sending servers attempt the lowest-priority MX host and only fall back to higher numbers if it is unreachable, so equal numbers share load and higher numbers are backups.',
      },
      {
        question: 'My domain shows no MX records — can it still get email?',
        answer: 'Some servers fall back to the domain’s A record, but you cannot rely on that. Without MX records most mail will bounce; add the records your email provider specifies.',
      },
      {
        question: 'How many MX records should a domain have?',
        answer: 'Whatever your provider prescribes. Google Workspace currently uses one record, Microsoft 365 one, and self-hosted setups often add a backup MX. Extra leftover records from an old provider can misroute mail and should be removed.',
      },
      {
        question: 'I changed my MX records — how soon will mail flow to the new host?',
        answer: 'After the old records’ TTL expires, typically minutes to a few hours. This checker shows the live authoritative answer, so once it lists only the new hosts, senders will follow.',
      },
    ],
    keywords: [
      'mx record checker',
      'mx lookup',
      'check mx records',
      'mail server lookup',
      'mx records for domain',
      'email dns check',
      'google workspace mx check',
      'mx priority',
    ],
    metaDescription:
      'Free MX record checker. List a domain’s mail servers with their priorities to verify email routing for Google Workspace, Microsoft 365, and more.',
  },

  'txt-record-checker': {
    longDescription: [
      'The TXT Record Checker reads a domain’s TXT records and organizes them into the sections that matter for email: SPF, DKIM, and DMARC, plus a list of every other TXT record on the name. Instead of running three separate lookups, one query shows your whole email-authentication posture.',
      'Under the hood the Exyconn server queries the domain itself for SPF and general TXT records, probes common DKIM selectors under _domainkey, and fetches the _dmarc policy record. Each section is labeled, so you can see immediately which of the three mechanisms are present and read their exact published values.',
      'This matters because Gmail, Outlook, and Yahoo now require SPF and DKIM — and increasingly DMARC — for reliable delivery. The tool also surfaces site-verification TXT records from Google, Microsoft, and other services, making it useful for confirming domain-ownership proofs during onboarding flows.',
    ],
    features: [
      'One lookup covers SPF, DKIM, DMARC, and all other TXT records',
      'Probes common DKIM selectors under _domainkey automatically',
      'Fetches the _dmarc policy record for the domain',
      'Shows exact published record values, not paraphrases',
      'Labeled sections so gaps in email authentication are obvious',
      'JSON copy and download of the full result',
    ],
    useCases: [
      'Audit SPF, DKIM, and DMARC before a cold-email or newsletter campaign',
      'Verify the TXT record a service asked you to add for domain ownership proof',
      'Debug DMARC failures by reading the exact published policy',
      'Confirm an SPF update took effect after adding a new sending service',
    ],
    howTo: [
      'Enter the domain to inspect',
      'Click "Check TXT Records"',
      'Read the SPF, DKIM, and DMARC sections to see what is published',
      'Check the All TXT section for verification and other records',
      'Copy or download the JSON result for your audit notes',
    ],
    faqs: [
      {
        question: 'What are SPF, DKIM, and DMARC?',
        answer: 'SPF lists which servers may send mail for your domain, DKIM lets receivers verify messages were signed by you, and DMARC tells receivers what to do when either check fails. Together they are the standard email-authentication trio.',
      },
      {
        question: 'Why does the DKIM section show nothing when I have DKIM set up?',
        answer: 'DKIM records live under a selector name (selector._domainkey.domain) and the tool probes only common selectors like google or default. If your provider uses a custom selector, look it up in their dashboard and query that hostname directly with the DNS Lookup tool.',
      },
      {
        question: 'Can a domain have more than one SPF record?',
        answer: 'No — multiple SPF records are invalid and cause receivers to fail the check. If you see two records starting with v=spf1, merge them into one.',
      },
      {
        question: 'Do I need DMARC if I already have SPF and DKIM?',
        answer: 'Yes for serious sending: Google and Yahoo require DMARC for bulk senders, and without it you get no reporting and no policy control over spoofed mail.',
      },
      {
        question: 'What are the other TXT records I see on my domain?',
        answer: 'Commonly site-verification tokens from Google, Microsoft, Facebook, and similar services proving domain ownership. They are harmless to keep, but remove ones for services you no longer use.',
      },
    ],
    keywords: [
      'txt record checker',
      'txt record lookup',
      'spf record check',
      'dkim checker',
      'dmarc record lookup',
      'email authentication check',
      'spf dkim dmarc test',
      'domain verification record',
    ],
    metaDescription:
      'Free TXT record checker that reads SPF, DKIM, and DMARC records in one lookup. Verify email authentication and domain ownership records fast.',
  },

  'nameserver-checker': {
    longDescription: [
      'The Nameserver Checker returns the authoritative NS records for a domain — the servers that answer all DNS queries for it — and resolves each nameserver to its IPv4 addresses. One lookup tells you both who controls the domain’s DNS and where those servers actually live.',
      'The check runs live on the Exyconn server, so it shows the delegation the public DNS currently follows. That is exactly what you need to verify after changing DNS providers: registrar dashboards can show the new nameservers long before the change is visible to the world, and this tool shows you the world’s view.',
      'It is useful for confirming a move to Cloudflare, Route 53, or any managed DNS host, for identifying which provider runs an unfamiliar domain’s DNS, and for spotting misconfigurations such as a single nameserver or a stale entry from a previous host lingering in the delegation.',
    ],
    features: [
      'Lists all authoritative nameservers for a domain',
      'Resolves each nameserver to its IPv4 address(es)',
      'Nameserver count chip for a quick redundancy check',
      'Live server-side lookup showing real-world delegation',
      'JSON copy and download of the result',
    ],
    useCases: [
      'Confirm a nameserver change to Cloudflare or Route 53 has propagated',
      'Identify which DNS provider hosts a domain you are investigating',
      'Verify all nameservers in a delegation belong to the same provider',
      'Check a client’s domain has at least two nameservers for redundancy',
    ],
    howTo: [
      'Enter the domain to check',
      'Click "Check NS"',
      'Review the listed nameservers and the IPs behind each one',
      'Compare them against what your DNS provider says they should be',
    ],
    faqs: [
      {
        question: 'What do nameservers actually do?',
        answer: 'They are the authoritative source for every DNS record on your domain — A, MX, TXT, and the rest. Whoever runs your nameservers effectively controls where your website and email go.',
      },
      {
        question: 'I changed nameservers at my registrar — when will this tool show the new ones?',
        answer: 'Delegation changes propagate through the parent zone, usually within a few hours and at most about 48. Once this tool shows the new set, resolvers worldwide are using them.',
      },
      {
        question: 'How many nameservers should a domain have?',
        answer: 'At least two, on separate networks, so DNS survives a single server failure. Most managed providers assign two to four automatically.',
      },
      {
        question: 'The listed nameservers are a mix of old and new providers. Is that a problem?',
        answer: 'Yes — resolvers may query either set, and the old provider’s zone can serve stale records. Replace the full set at your registrar so only the current provider’s nameservers remain.',
      },
    ],
    keywords: [
      'nameserver checker',
      'ns lookup',
      'check nameservers',
      'authoritative nameserver lookup',
      'dns provider lookup',
      'whose dns is this domain using',
      'ns record check',
    ],
    metaDescription:
      'Free nameserver checker. See the authoritative NS records for any domain, with the IPv4 address behind each nameserver, in one lookup.',
  },

  'ssl-checker': {
    longDescription: [
      'The SSL Certificate Checker opens a real TLS connection to a domain on port 443 (with SNI) and reports everything about the certificate it presents: subject, issuer, validity window, days remaining, serial number, SHA-1 and SHA-256 fingerprints, the full list of subject alternative names, and the negotiated TLS protocol version.',
      'Because the check performs an actual handshake from the Exyconn server rather than parsing a cached copy, you see exactly the certificate visitors receive right now — including whether the chain validates. A green "Valid" chip and a days-remaining counter give the verdict instantly, with the technical detail laid out in tables below.',
      'Use it after installing or renewing a certificate to confirm the new one is being served, to check which hostnames a certificate actually covers before pointing a new subdomain at a server, or to verify a third-party site’s certificate details before integrating with it.',
    ],
    features: [
      'Live TLS handshake on port 443 with SNI — sees what browsers see',
      'Valid/Invalid verdict and days-remaining counter at a glance',
      'Full subject and issuer details in separate tables',
      'Complete subject alternative name (SAN) list',
      'SHA-1 and SHA-256 fingerprints plus serial number for pinning and audits',
      'Reports the negotiated TLS protocol version',
    ],
    useCases: [
      'Confirm a renewed certificate is actually being served, not the old one',
      'Check which subdomains a certificate’s SAN list covers before a launch',
      'Verify the issuer and fingerprint of a certificate during a security review',
      'Diagnose browser certificate warnings reported by users',
    ],
    howTo: [
      'Enter the domain to test, e.g. example.com',
      'Click "Check SSL"',
      'Read the Valid chip and days-remaining count',
      'Expand the subject, issuer, and SAN details for specifics',
      'Download the JSON if you need fingerprints for documentation',
    ],
    faqs: [
      {
        question: 'Why does the checker show the old certificate after I renewed?',
        answer: 'Your server is still serving the old file — renewing with the CA does not deploy it. Reload or restart the web server (or check your load balancer’s certificate binding) and re-test.',
      },
      {
        question: 'What does "Valid" actually verify?',
        answer: 'That the TLS handshake succeeded and the certificate chain was accepted by the server-side trust store — the same style of validation a browser performs, including hostname matching via SNI.',
      },
      {
        question: 'What are subject alternative names?',
        answer: 'The SAN list is the set of hostnames the certificate is valid for. Browsers match against SANs, not the common name, so a subdomain missing from this list will trigger a warning.',
      },
      {
        question: 'Can I check a certificate on a port other than 443?',
        answer: 'This tool checks the standard HTTPS port 443 only. Services on other ports (mail, databases) need a dedicated client such as openssl s_client.',
      },
      {
        question: 'My Let’s Encrypt certificate shows about 90 days validity. Is that right?',
        answer: 'Yes — Let’s Encrypt issues 90-day certificates by design and expects automated renewal roughly every 60 days. Short lifetimes are normal, not a problem.',
      },
    ],
    keywords: [
      'ssl checker',
      'ssl certificate checker',
      'check ssl certificate',
      'tls certificate check',
      'certificate expiry check',
      'ssl test online',
      'certificate san list',
      'https certificate details',
    ],
    metaDescription:
      'Free SSL certificate checker. Verify a domain’s HTTPS certificate: issuer, validity dates, days remaining, SANs, fingerprints, TLS version.',
  },

  'ssl-expiry-monitor': {
    longDescription: [
      'The SSL Expiry Monitor answers one question fast: how long until this domain’s certificate expires? It performs a live TLS handshake, reads the certificate’s validity window, and classifies the result into a color-coded status — valid, warning (30 days or less), critical (7 days or less), or expired.',
      'Alongside the countdown you get the exact valid-from and valid-to dates, the issuer, and the certificate subject, so you know which certificate you are looking at when a domain serves several over time. The check runs from the Exyconn server, so the result is the certificate real visitors are receiving.',
      'An expired certificate takes a site down as effectively as a server crash — browsers show a full-page warning most users will not click through. This tool is built for routine checks across the domains you are responsible for: run it on each one and renew anything that shows warning or critical before it becomes an outage.',
    ],
    features: [
      'Days-remaining countdown from a live TLS handshake',
      'Clear status levels: valid, warning (≤30 days), critical (≤7 days), expired',
      'Exact valid-from and valid-to dates',
      'Issuer and subject shown so you know which certificate you are seeing',
      'JSON copy and download for renewal tracking sheets',
    ],
    useCases: [
      'Run a weekly expiry sweep across all client domains you manage',
      'Check certificate health before a marketing campaign drives traffic to a site',
      'Verify auto-renewal (e.g. certbot) is actually replacing certificates on schedule',
      'Audit a newly inherited infrastructure for certificates close to expiry',
    ],
    howTo: [
      'Enter the domain to monitor',
      'Click "Check SSL Expiry"',
      'Read the status chip and the days-remaining figure',
      'Renew anything showing warning, critical, or expired',
      'Re-check after renewal to confirm the new dates are live',
    ],
    faqs: [
      {
        question: 'At what point should I renew a certificate?',
        answer: 'Renew when the status hits warning (30 days out). That leaves time to fix deployment problems before expiry — critical (7 days) means act immediately.',
      },
      {
        question: 'What happens when a certificate expires?',
        answer: 'Browsers block the site behind a full-page security warning and API clients refuse the connection. Traffic effectively drops to zero until a valid certificate is deployed.',
      },
      {
        question: 'I renewed but the tool still shows the old expiry date. Why?',
        answer: 'The new certificate has not been deployed to the server — renewal and deployment are separate steps. Reload the web server or check your automation, then re-test.',
      },
      {
        question: 'Does this tool keep monitoring my domain automatically?',
        answer: 'It performs an on-demand check each time you run it; it does not schedule background checks or send alerts. Re-run it as part of your routine, e.g. weekly.',
      },
    ],
    keywords: [
      'ssl expiry checker',
      'ssl certificate expiry',
      'when does ssl expire',
      'certificate expiration monitor',
      'check ssl expiry date',
      'ssl renewal check',
      'tls expiry monitor',
    ],
    metaDescription:
      'Free SSL expiry checker. See exactly how many days remain on a domain’s certificate with clear valid, warning, critical, or expired status.',
  },

  'domain-age-checker': {
    longDescription: [
      'The Domain Age Checker finds out exactly when a domain was first registered and calculates its age down to the day. It pulls the registration event from live RDAP registry data and presents the original registration date, the age broken into years, months, and days, and the total day count.',
      'Because the date comes from the registry’s own event log rather than a third-party database, it reflects the domain’s true registration history as the registry records it. If a registry does not publish a registration event — rare, but it happens with some ccTLDs — the tool says so instead of guessing.',
      'Domain age is a practical trust signal. SEO practitioners weigh it when valuing expired domains, security teams treat very young domains as phishing risk indicators, and buyers verify a seller’s "aged domain" claim before paying a premium. This tool turns that check into a two-second lookup.',
    ],
    features: [
      'Exact registration date from live RDAP registry data',
      'Age computed in years, months, and days',
      'Total-days figure for spreadsheets and comparisons',
      'Honest "registration date not found" message when a registry withholds it',
      'JSON copy and download of the result',
    ],
    useCases: [
      'Verify an "aged domain" claim before buying it on a marketplace',
      'Flag very recently registered domains when investigating phishing emails',
      'Compare competitor domain ages during SEO research',
      'Document a domain’s history for a trademark or dispute filing',
    ],
    howTo: [
      'Enter the domain to check',
      'Click "Check Age"',
      'Read the registration date and the computed age',
      'Download the JSON if you need the figures for a report',
    ],
    faqs: [
      {
        question: 'Does domain age affect SEO rankings?',
        answer: 'Google has said age itself is not a direct ranking factor, but older domains have had more time to earn links and history. Age matters most as a trust and valuation signal, not a ranking switch.',
      },
      {
        question: 'Is the age based on registration or on when the website launched?',
        answer: 'Registration. The tool reads the registry’s registration event, which can predate the first website on the domain by years.',
      },
      {
        question: 'Does the age reset if a domain expires and is re-registered?',
        answer: 'Yes. Once a domain fully drops and is registered again, the registry records a new registration event, and this tool shows the new date.',
      },
      {
        question: 'Why does the tool say the registration date was not found?',
        answer: 'A few registries, mostly ccTLDs, do not publish registration events over RDAP or WHOIS. In that case no reliable age can be computed from public data.',
      },
    ],
    keywords: [
      'domain age checker',
      'how old is a domain',
      'domain registration date',
      'check domain age',
      'domain age lookup',
      'when was domain registered',
      'aged domain check',
    ],
    metaDescription:
      'Free domain age checker. Find out exactly when a domain was registered and its age in years, months, and days using live RDAP registry data.',
  },

  'domain-availability': {
    longDescription: [
      'The Domain Availability Checker gives you a fast first answer on whether a domain name is taken. It performs a live DNS resolution: if the name resolves to IP addresses, the domain is definitely registered and in use, and the tool shows you the addresses it found. If nothing resolves, the domain might be available to register.',
      'This DNS-based approach is deliberately quick — it answers in under a second without querying rate-limited registrar APIs. The honest trade-off is that a registered-but-parked domain with no DNS records can look available, which is why the result is worded "might be available" rather than a guarantee. Confirm at a registrar before celebrating.',
      'It is ideal for brainstorm sessions: when you are cycling through dozens of name ideas for a product, brand, or side project, this tool lets you eliminate the clearly-taken names instantly and shortlist candidates worth a definitive registrar check. Pair it with the WHOIS Lookup tool to inspect names that are taken.',
    ],
    features: [
      'Sub-second check via live DNS resolution',
      'Definitive "registered" verdict when the domain resolves, with its IPs listed',
      '"Might be available" signal for names with no DNS presence',
      'No rate limits from registrar APIs slowing down bulk brainstorming',
      'JSON copy and download of each result',
    ],
    useCases: [
      'Rapidly eliminate taken names while brainstorming a startup or product name',
      'Check whether a domain from an old bookmark still has an active site',
      'Shortlist candidate domains before running definitive registrar checks',
      'See which IPs a taken domain currently points to',
    ],
    howTo: [
      'Enter the domain name you want, e.g. mybrandidea.com',
      'Click "Check Availability"',
      'Read the verdict — registered (with IPs) or possibly available',
      'For "might be available" results, confirm and register at your registrar',
    ],
    faqs: [
      {
        question: 'The tool says "might be available" — is the domain definitely free?',
        answer: 'Not guaranteed. The check is DNS-based, so a registered domain with no DNS records can appear available. Treat it as a strong hint and confirm with a registrar search before deciding.',
      },
      {
        question: 'If the tool says the domain is registered, is that certain?',
        answer: 'Yes. A name only resolves to IP addresses if it is registered and delegated, so the "registered" verdict is definitive.',
      },
      {
        question: 'Does checking a domain here risk someone front-running my idea?',
        answer: 'The lookup is an ordinary DNS query answered by public resolvers, the same as typing the name into a browser. It is not sent to any registrar or marketplace.',
      },
      {
        question: 'Can I check any extension, like .io or .dev?',
        answer: 'Yes — the DNS check works identically for every TLD. Availability and pricing for the actual registration still depend on the registrar and registry.',
      },
      {
        question: 'How do I check who owns a taken domain?',
        answer: 'Use the WHOIS Lookup tool on this site: it shows the registrar, registration and expiry dates, and status codes for any registered domain.',
      },
    ],
    keywords: [
      'domain availability checker',
      'is this domain available',
      'check domain name availability',
      'domain name search',
      'free domain check',
      'domain taken or available',
      'available domain lookup',
    ],
    metaDescription:
      'Free domain availability checker. Instantly see whether a domain name is already registered or possibly free to register, via a live DNS check.',
  },

  'domain-expiry-checker': {
    longDescription: [
      'The Domain Expiry Checker looks up when a domain expires using live RDAP registry data and tells you how many days remain. The result is graded for you: Safe when more than 90 days remain, Renew Soon between 31 and 90, and Critical at 30 days or fewer — alongside the exact expiry date, the original registration date, and the domain’s status codes.',
      'Reading expiry straight from the registry matters because registrar dashboards only show domains in that registrar’s account. This tool works on any domain — your own portfolio spread across registrars, a client’s domain you do not control, or a domain you are hoping will drop so you can register it.',
      'Losing a domain to an expired renewal is one of the most avoidable outages there is: email stops, the website vanishes, and recovery through redemption periods is slow and expensive. A periodic pass through this checker across every domain you depend on is cheap insurance.',
    ],
    features: [
      'Exact expiry date from live RDAP registry data',
      'Days-until-expiry countdown',
      'Graded verdict: Safe (>90 days), Renew Soon, Critical (≤30 days)',
      'Registration date and EPP status codes included',
      'Works on any domain at any registrar — not just your own account',
      'JSON copy and download for renewal tracking',
    ],
    useCases: [
      'Audit renewal dates across a portfolio spread over multiple registrars',
      'Check a client domain’s expiry before taking over their website project',
      'Watch a desirable domain’s expiry date while waiting for it to drop',
      'Verify a renewal actually went through by confirming the new expiry date',
    ],
    howTo: [
      'Enter the domain to check',
      'Click "Check Expiry"',
      'Read the expiry date, days remaining, and the Safe/Renew Soon/Critical verdict',
      'Renew anything at Critical immediately and diarize the rest',
    ],
    faqs: [
      {
        question: 'What happens when a domain actually expires?',
        answer: 'Typically a grace period of 0–45 days where the owner can renew at normal price, then a redemption period (~30 days) with a hefty recovery fee, then release for public registration. Websites and email usually stop working early in that timeline.',
      },
      {
        question: 'Why does the expiry date differ from my registrar dashboard by a day?',
        answer: 'Registries record expiry in UTC and dashboards often render it in your local timezone. A one-day apparent difference across timezones is normal.',
      },
      {
        question: 'Can I check domains I don’t own?',
        answer: 'Yes. Expiry dates are public registry data, so you can check any registered domain — useful for monitoring a domain you hope to acquire.',
      },
      {
        question: 'The tool shows no expiry date. Why?',
        answer: 'Some ccTLD registries do not publish expiration events over RDAP or WHOIS. For those extensions the registrar of record is the only reliable source.',
      },
      {
        question: 'Does auto-renew at my registrar make this check unnecessary?',
        answer: 'Auto-renew fails silently when a card expires or a payment bounces. Checking the registry-recorded date confirms the renewal actually happened.',
      },
    ],
    keywords: [
      'domain expiry checker',
      'when does domain expire',
      'domain expiration date lookup',
      'check domain expiry date',
      'domain renewal date',
      'domain expiry lookup',
      'expired domain check',
    ],
    metaDescription:
      'Free domain expiry checker. Look up a domain’s expiration date and days remaining from live RDAP data so you never lose a domain to a lapse.',
  },

  'subdomain-finder': {
    longDescription: [
      'The Subdomain Finder discovers active subdomains of a domain by testing 48 of the most common subdomain names — www, mail, api, dev, staging, admin, vpn, cdn, blog, and the rest — against live DNS. Every name that resolves is listed with the IP addresses behind it, alongside a found/checked tally.',
      'The scan runs from the Exyconn server as a batch of parallel DNS lookups, so it completes in a few seconds and involves no crawling, brute-force wordlists, or interaction with the target’s web servers — only standard DNS queries that any resolver performs.',
      'Security-minded engineers use it to spot forgotten attack surface: a staging. or admin. subdomain that still resolves is a common source of exposed dashboards and stale apps. It is equally useful for mapping your own estate before a migration, or for quickly seeing how a competitor structures their infrastructure.',
    ],
    features: [
      'Tests 48 common subdomain names in one parallel scan',
      'Covers infrastructure names like api, dev, staging, admin, vpn, cdn, git',
      'Shows the resolved IP addresses for every subdomain found',
      'Found/checked counters summarize the result at a glance',
      'DNS-only technique — no crawling or contact with target web servers',
      'JSON copy and download of the discovered list',
    ],
    useCases: [
      'Find forgotten staging or admin subdomains still resolving on your domain',
      'Map an inherited domain’s infrastructure before a migration',
      'Reconnaissance during an authorized security assessment',
      'Check which provider IPs a company’s mail and api subdomains point to',
    ],
    howTo: [
      'Enter the root domain, e.g. example.com',
      'Click "Find Subdomains" and let the parallel scan run',
      'Review the subdomains found and the IPs behind each one',
      'Investigate any staging, admin, or dev names that should not be public',
    ],
    faqs: [
      {
        question: 'Does this find every subdomain a domain has?',
        answer: 'No. It tests a curated list of 48 common names, so it finds the usual ones fast but misses custom or randomly-named subdomains. It is a quick reconnaissance pass, not an exhaustive enumeration.',
      },
      {
        question: 'Is running this scan legal?',
        answer: 'The scan only sends ordinary DNS queries — the same lookups a browser makes — and never contacts the target’s servers directly. That is generally fine, but only run reconnaissance against domains you own or are authorized to assess.',
      },
      {
        question: 'Why does a subdomain resolve but its website not load?',
        answer: 'A DNS record can exist while the service behind it is down, moved, or firewalled. Resolution proves the record is published, not that a live site answers on it.',
      },
      {
        question: 'A found subdomain points to an internal-looking IP — is that a risk?',
        answer: 'Subdomains that resolve to private ranges or forgotten staging hosts often expose unpatched dashboards. Treat any admin, staging, dev, or vpn hit as something to review or lock down.',
      },
    ],
    keywords: [
      'subdomain finder',
      'find subdomains',
      'subdomain scanner',
      'subdomain enumeration',
      'discover subdomains of a domain',
      'subdomain lookup',
      'subdomain discovery tool',
    ],
    metaDescription:
      'Free subdomain finder. Discover a domain’s active subdomains by testing 48 common names against live DNS, with the IP behind each result.',
  },

  'blacklist-check': {
    longDescription: [
      'The Domain Blacklist Checker resolves a domain to its IP address and queries it against eight major DNS-based blocklists (DNSBLs) — including Spamhaus ZEN, SpamCop, Barracuda, SORBS, and UCEPROTECT. For each list it reports whether your IP is listed or clean, and gives an overall listed/checked count so you know instantly if your sending reputation is in trouble.',
      'Each check is a real-time DNS query against the blocklist’s zone, run from the Exyconn server, so the verdict reflects the lists’ current state. A single listing on a major DNSBL can send your legitimate email straight to spam folders or cause outright rejections, which is why regular checks matter for anyone who sends mail.',
      'It is built for email administrators, deliverability specialists, and IT teams who need to know why messages are bouncing. If the tool shows a listing, it names the specific blocklist so you can visit that provider’s site to see the reason and request delisting once the underlying issue is fixed.',
    ],
    features: [
      'Checks eight major DNSBLs in one pass',
      'Resolves the domain to its IP and queries each list live',
      'Per-list Listed/Clean verdict, plus an overall listed/checked count',
      'Names the exact blocklists a listing appears on for follow-up',
      'JSON copy and download for deliverability reports',
    ],
    useCases: [
      'Diagnose why your emails are landing in spam or bouncing',
      'Check a new sending IP’s reputation before starting to send',
      'Confirm a delisting request took effect after cleaning up an issue',
      'Audit a mail server’s reputation as part of a deliverability review',
    ],
    howTo: [
      'Enter the domain whose IP you want to check',
      'Click "Check Blacklists"',
      'Read the overall listed/checked count and the per-list results',
      'For any "Listed" result, visit that blocklist’s site to request delisting',
    ],
    faqs: [
      {
        question: 'What is a DNSBL?',
        answer: 'A DNS-based blocklist is a list of IP addresses known for sending spam or abuse. Receiving mail servers query these lists and may reject or spam-folder mail from any listed IP.',
      },
      {
        question: 'My IP is listed — how do I get removed?',
        answer: 'First fix the cause (a compromised account, open relay, or bad sending practice), then use the delisting form on the specific blocklist’s website. Delisting before fixing the root cause usually results in a fast re-listing.',
      },
      {
        question: 'Does this check the domain or the IP?',
        answer: 'It resolves the domain to its primary IP and checks that IP against the blocklists, since DNSBLs list IP addresses. For accurate mail-reputation results, check the IP your mail actually sends from.',
      },
      {
        question: 'Why am I listed on one blocklist but clean on the others?',
        answer: 'Each list has its own criteria and data sources. A listing on a single minor list has limited impact; a listing on a major one like Spamhaus ZEN affects deliverability widely.',
      },
    ],
    keywords: [
      'blacklist check',
      'dnsbl check',
      'ip blacklist checker',
      'domain blacklist lookup',
      'email blacklist check',
      'spamhaus check',
      'is my ip blacklisted',
      'mail server reputation check',
    ],
    metaDescription:
      'Free blacklist checker. Test a domain’s IP against eight major DNSBLs like Spamhaus and SpamCop to diagnose email deliverability problems.',
  },

  'http-headers-check': {
    longDescription: [
      'The HTTP Headers Checker sends a request to any URL and shows the full set of response headers the server returns, plus a focused security-header audit. It reports the HTTP status code, the Server and X-Powered-By values, the content type, and every raw header — then separately flags which key security headers are present and which are missing.',
      'The security section checks the seven headers that matter most: Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, and Permissions-Policy. Each is marked Set or Missing, and the missing ones are summarized so you have a concrete hardening checklist for the site.',
      'It is aimed at web developers verifying deployment configuration, security engineers auditing a site’s defenses, and anyone debugging caching, redirects, or CORS. The request runs server-side from Exyconn, so you see the true headers a client receives — not a version altered by your browser’s extensions or cache.',
    ],
    features: [
      'Shows the complete set of raw HTTP response headers',
      'Reports status code, Server, X-Powered-By, and content type',
      'Audits seven key security headers as Set or Missing',
      'Summarizes the missing security headers as a hardening checklist',
      'Server-side request — true headers, unaltered by your browser',
      'JSON copy and download of the full header set',
    ],
    useCases: [
      'Verify HSTS and CSP are deployed correctly after a security hardening pass',
      'Check what technology a server reveals via Server and X-Powered-By headers',
      'Debug caching behavior by inspecting Cache-Control and ETag headers',
      'Audit a site’s security headers before a launch or compliance review',
    ],
    howTo: [
      'Enter the full URL to inspect, e.g. https://example.com',
      'Click "Check Headers"',
      'Review the status code and the Set/Missing security-header list',
      'Scan the full raw headers for caching, CORS, or server details',
      'Add any missing security headers to your server configuration',
    ],
    faqs: [
      {
        question: 'Which security headers should every site have?',
        answer: 'At minimum Strict-Transport-Security, X-Content-Type-Options, and a solid Content-Security-Policy. X-Frame-Options, Referrer-Policy, and Permissions-Policy add further protection against clickjacking and data leakage.',
      },
      {
        question: 'Why hide the Server and X-Powered-By headers?',
        answer: 'They reveal your web server and framework versions, which helps attackers target known vulnerabilities. Suppressing or genericizing them is a small but worthwhile hardening step.',
      },
      {
        question: 'Does this send a full page request?',
        answer: 'It issues a lightweight request to read the headers and does not render or execute the page. You get the server’s response metadata without downloading the whole document.',
      },
      {
        question: 'Why do the headers differ from my browser’s dev tools?',
        answer: 'Browser extensions, service workers, and caches can alter what you see locally. This server-side check shows the unmodified headers a fresh client receives.',
      },
    ],
    keywords: [
      'http headers checker',
      'check response headers',
      'security headers test',
      'http header viewer',
      'view http headers online',
      'hsts csp check',
      'server header lookup',
      'response header analyzer',
    ],
    metaDescription:
      'Free HTTP headers checker. Inspect a URL’s full response headers and audit HSTS, CSP, and other security headers as Set or Missing in one click.',
  },

  'open-ports-check': {
    longDescription: [
      'The Open Port Checker scans a host for the most common network ports and tells you which are open, closed, or filtered. By default it probes 17 well-known ports — FTP, SSH, SMTP, DNS, HTTP, POP3, IMAP, HTTPS, mail submission ports, MySQL, RDP, PostgreSQL, and HTTP alternates — and labels each with its recognized service name.',
      'Each probe is a real TCP connection attempt from the Exyconn server with a short timeout: a successful connect means open, an immediate refusal means closed, and a timeout means filtered (typically blocked by a firewall). The result shows an open count and a scanned count so you can quickly gauge a host’s exposed surface.',
      'It is useful for verifying that a firewall is doing its job, confirming a newly deployed service is actually reachable, and spotting risky exposures — a database port like 3306 or an RDP port like 3389 open to the internet is a serious finding worth closing immediately.',
    ],
    features: [
      'Scans 17 common ports across web, mail, database, and remote-access services',
      'Classifies each port as open, closed, or filtered',
      'Labels every port with its recognized service (SSH, HTTPS, MySQL, RDP, …)',
      'Open-count and scanned-count summary chips',
      'Real TCP connection probes from the Exyconn server',
      'JSON copy and download of the scan result',
    ],
    useCases: [
      'Verify a firewall is blocking database and admin ports from the internet',
      'Confirm a newly opened service (e.g. SSH on 22) is reachable',
      'Spot dangerous exposures like an open RDP (3389) or MySQL (3306) port',
      'Sanity-check a server’s exposed surface after a configuration change',
    ],
    howTo: [
      'Enter the host to scan, e.g. example.com',
      'Click "Scan Ports"',
      'Review which ports came back open, closed, or filtered',
      'Close or firewall any open port that should not be public',
    ],
    faqs: [
      {
        question: 'What is the difference between closed and filtered?',
        answer: 'Closed means the host actively refused the connection (nothing is listening), while filtered means the probe timed out with no response — usually a firewall silently dropping the packets.',
      },
      {
        question: 'Which ports does the default scan cover?',
        answer: 'The 17 most common: 21, 22, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3306, 3389, 5432, 8080, and 8443, spanning web, mail, DNS, database, and remote-access services.',
      },
      {
        question: 'Is scanning ports on a host legal?',
        answer: 'Scanning hosts you own or are authorized to test is fine. Unsolicited scanning of third-party systems may violate acceptable-use policies, so only scan targets you have permission for.',
      },
      {
        question: 'An important database port is open — what should I do?',
        answer: 'Restrict it immediately. Database and admin ports should be firewalled to trusted IPs or a VPN, never exposed to the public internet, to avoid brute-force and exploitation attacks.',
      },
    ],
    keywords: [
      'open port checker',
      'port scanner online',
      'check open ports',
      'tcp port check',
      'is port open',
      'port scan tool',
      'firewall port test',
      'online port checker',
    ],
    metaDescription:
      'Free open port checker. Scan a host’s 17 most common ports to see which are open, closed, or filtered — verify firewalls and spot exposures.',
  },

  'redirect-checker': {
    longDescription: [
      'The Redirect Checker traces the full chain of HTTP redirects a URL goes through before it reaches its final destination. It follows each hop one step at a time, recording the status code (301, 302, 307, 308) and the target location at every stage, then shows you the complete path and the final resolved URL.',
      'Because it walks the chain hop-by-hop from the Exyconn server rather than letting the browser silently follow along, you see every intermediate step — including the exact redirect type. That distinction matters for SEO: a 301 passes ranking signals permanently, while a 302 is treated as temporary, and mixing them up quietly bleeds link equity.',
      'SEO specialists use it to audit migrations and catch redirect chains that slow crawling, developers use it to debug why a URL lands somewhere unexpected, and marketers use it to verify that shortened or tracking links resolve to the right page. Long chains and loops both show up clearly.',
    ],
    features: [
      'Traces every redirect hop from the first URL to the final destination',
      'Shows the status code (301/302/307/308) and target at each step',
      'Reports the total number of redirects and the final resolved URL',
      'Detects redirect chains and stops safely on loops',
      'Hop-by-hop resolution from the server, not silent browser following',
      'JSON copy and download of the full chain',
    ],
    useCases: [
      'Audit a site migration to confirm old URLs 301 to the right new pages',
      'Catch inefficient redirect chains that waste crawl budget and slow load',
      'Verify a shortened or UTM tracking link resolves to the intended page',
      'Debug an unexpected final destination caused by stacked redirects',
    ],
    howTo: [
      'Enter the starting URL, e.g. https://example.com',
      'Click "Check Redirects"',
      'Read the chain of hops with each status code and target',
      'Confirm the final URL and redirect types are what you intended',
    ],
    faqs: [
      {
        question: 'What is the difference between a 301 and a 302 redirect?',
        answer: 'A 301 is permanent and passes SEO ranking signals to the new URL; a 302 is temporary and search engines keep the original URL indexed. Use 301 for moves you intend to keep.',
      },
      {
        question: 'Why are long redirect chains bad?',
        answer: 'Each hop adds latency for users and consumes crawl budget for search engines. Chains longer than one or two hops should be collapsed so the first URL points directly at the final destination.',
      },
      {
        question: 'What happens if there is a redirect loop?',
        answer: 'The checker follows a bounded number of hops and stops, so an infinite loop is reported rather than hanging. A loop in the chain is a bug that will break the page for real users.',
      },
      {
        question: 'Does it follow HTTPS and cross-domain redirects?',
        answer: 'Yes. It follows redirects across protocols and domains, resolving relative locations against the current URL, so you see the true end-to-end path.',
      },
    ],
    keywords: [
      'redirect checker',
      'http redirect tracer',
      'check url redirects',
      '301 redirect checker',
      'redirect chain checker',
      'trace redirects online',
      'url redirect test',
      '302 vs 301 check',
    ],
    metaDescription:
      'Free redirect checker. Trace every hop in a URL’s redirect chain with each status code and target, and confirm the final destination and SEO type.',
  },

  'website-status-checker': {
    longDescription: [
      'The Website Status Checker tells you whether a site is up or down right now, and how fast it responds. It makes a live request to the URL from the Exyconn server and reports the HTTP status code and text, an up/down verdict, the response time in milliseconds, the server software, the content type, and the content length.',
      'Because the check runs from a server rather than your own connection, it settles the common "is it just me?" question: if the tool reports the site is up but you cannot reach it, the problem is local — your network, DNS, or ISP — rather than the site itself. If it reports the site down, the outage is real for everyone.',
      'It is handy for quickly confirming a deployment is live, spot-checking a site a visitor reported as broken, and reading the exact status code behind an error page. A slow response time is an early warning that the server is under load even when it is technically still up.',
    ],
    features: [
      'Live up/down verdict from a server-side request',
      'HTTP status code and status text',
      'Response time in milliseconds',
      'Server software, content type, and content length',
      'Distinguishes a real outage from a local connectivity problem',
      'JSON copy and download of the result',
    ],
    useCases: [
      'Confirm a site is really down and not just unreachable from your network',
      'Verify a deployment is serving traffic immediately after going live',
      'Check the exact status code behind a 500 or 503 error page',
      'Spot a slow response time that signals a struggling server',
    ],
    howTo: [
      'Enter the site URL, e.g. https://example.com',
      'Click "Check Status"',
      'Read the up/down verdict, status code, and response time',
      'Compare with your own experience to isolate local vs. real outages',
    ],
    faqs: [
      {
        question: 'The tool says the site is up but I can’t reach it. Why?',
        answer: 'The check runs from the server’s network, so an "up" result with a failure on your end points to a local cause — your DNS cache, ISP routing, a firewall, or a VPN. Try another network or flush your DNS.',
      },
      {
        question: 'What counts as "up"?',
        answer: 'A response with a status code in the 200–399 range. Codes of 400 and above (like 404 or 500) mean the server answered but returned an error, which the tool reports with the exact code.',
      },
      {
        question: 'Does a fast response time mean the whole site is fast?',
        answer: 'It measures the server’s time to respond to a single request, not full page render. For a complete performance picture including page weight and resource counts, use the Page Speed Checker.',
      },
      {
        question: 'Does this check keep monitoring the site?',
        answer: 'No — it performs a single on-demand check each time you run it. It does not run continuous monitoring or send downtime alerts.',
      },
    ],
    keywords: [
      'website status checker',
      'is this website down',
      'website up or down',
      'site status check',
      'website uptime check',
      'check if site is down',
      'website availability checker',
      'is it down right now',
    ],
    metaDescription:
      'Free website status checker. See instantly whether a site is up or down, its HTTP status code, and response time from a live server-side request.',
  },

  'page-speed-checker': {
    longDescription: [
      'The Page Speed Checker measures how quickly a page loads and breaks down what it is made of. It fetches the page from the Exyconn server, records the total load time and a Fast/Average/Slow rating, and reports the page size in kilobytes along with counts of scripts, stylesheets, images, and inline styles found in the HTML.',
      'These resource counts explain the timing: a slow page is usually slow because it pulls in dozens of scripts and stylesheets or ships a heavy HTML document. Seeing the numbers next to the load time turns a vague "the site feels sluggish" into a concrete list of things to trim, defer, or combine.',
      'It is aimed at developers and site owners doing a quick performance triage and at SEO practitioners who know page speed influences rankings and bounce rates. Use it to compare pages, to check the impact of a change before and after, or to justify a performance cleanup with real figures.',
    ],
    features: [
      'Total page load time with a Fast/Average/Slow rating',
      'Page size reported in kilobytes',
      'Counts of scripts, stylesheets, images, and inline styles',
      'Server-side fetch for a consistent, network-independent measurement',
      'JSON copy and download of the metrics',
    ],
    useCases: [
      'Triage why a page feels slow and identify the heaviest resource types',
      'Compare page weight and load time before and after an optimization',
      'Check a competitor’s page size and resource load for benchmarking',
      'Back up a request for a performance cleanup with concrete numbers',
    ],
    howTo: [
      'Enter the page URL, e.g. https://example.com',
      'Click "Check Speed"',
      'Read the load time, rating, and page size',
      'Review the script, stylesheet, and image counts to find what to trim',
    ],
    faqs: [
      {
        question: 'What load time counts as fast?',
        answer: 'This tool rates under 1 second as Fast, 1–3 seconds as Average, and over 3 seconds as Slow. Users start abandoning pages beyond roughly 3 seconds, so aim to stay in the Fast band.',
      },
      {
        question: 'Why is my page size larger than the visible content suggests?',
        answer: 'The figure is the HTML document’s byte size. A large number often means heavy inline styles, embedded data, or bloated markup — separate from the images and scripts the page then loads.',
      },
      {
        question: 'Does a high script count always mean a slow page?',
        answer: 'Not always, but many blocking scripts and stylesheets are a frequent cause of slow rendering. Reducing, deferring, or combining them is usually the highest-impact fix.',
      },
      {
        question: 'Is this the same as Google PageSpeed Insights?',
        answer: 'No. This is a fast triage of load time and page composition. It does not compute Core Web Vitals or Lighthouse scores — use it for a quick check, then a full audit tool for detailed field metrics.',
      },
    ],
    keywords: [
      'page speed checker',
      'website speed test',
      'page load time test',
      'check page speed',
      'website performance test',
      'page size checker',
      'site load time checker',
      'web page speed analysis',
    ],
    metaDescription:
      'Free page speed checker. Measure a page’s load time, size, and script, stylesheet, and image counts to find what is slowing it down.',
  },
};
