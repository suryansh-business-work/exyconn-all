import gql from 'graphql-tag';

/**
 * Account health for the CRM's mailboxes: the DNS and blocklist checks on every domain the
 * company's Gmail and Microsoft mailboxes send from, with a 0–100 Setup Score.
 */
export const mailHealthTypeDefs = gql`
  "What one health check is about."
  enum MailHealthCheckCode {
    SPF
    DKIM
    DMARC
    MX
    BLACKLIST
  }

  "How a health check came out. UNKNOWN means the lookup failed, and it is left out of the score."
  enum MailHealthCheckStatus {
    PASS
    WARN
    FAIL
    UNKNOWN
  }

  "One check on a sending domain, with what to change when it is not a pass."
  type MailHealthCheck {
    code: MailHealthCheckCode!
    status: MailHealthCheckStatus!
    "What was found, in one sentence."
    message: String!
    "What to change; empty on a pass."
    fix: String!
    "The DNS record (or blocklist) the check is about, as found; empty when there is none."
    record: String!
    "A DNS value to paste in to fix it; empty when there is nothing to paste."
    suggested: String!
  }

  "A domain the CRM mailboxes send from, with its last health check."
  type MailDomainHealth {
    domain: String!
    "The providers its mailboxes are on: GMAIL, MICROSOFT."
    providers: [String!]!
    "The connected mailboxes on the domain."
    mailboxes: [String!]!
    "0–100 Setup Score of the last check; null until the domain has been checked."
    score: Int
    "The score before the last check; null on a first check."
    previousScore: Int
    "When it was last checked; the daily pass re-checks every domain."
    checkedAt: DateTime
    checks: [MailHealthCheck!]!
  }

  extend type Query {
    "Health (SPF, DKIM, DMARC, MX, blocklists and Setup Score) of every domain the company's CRM mailboxes send from."
    mailDomainHealth: [MailDomainHealth!]!
  }

  extend type Mutation {
    "Runs the health checks on one of the company's sending domains now and keeps the result."
    checkMailDomainHealth(
      "A domain the company's CRM mailboxes send from, e.g. example.com."
      domain: String!
    ): MailDomainHealth!
  }
`;
