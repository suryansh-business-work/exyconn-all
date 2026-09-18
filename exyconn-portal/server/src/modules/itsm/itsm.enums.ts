/**
 * Every enumeration the IT service-management module stores. Each list mirrors a GraphQL
 * enum of the same name in the module's SDL, so the schema and the database accept exactly
 * the same values.
 */

/** What an access request asks IT to do. A password reset is an access change too. */
export const IT_ACCESS_KINDS = ['GRANT', 'ROLE_CHANGE', 'REVOKE', 'PASSWORD_RESET'] as const;
export const IT_ACCESS_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'FULFILLED',
  'CANCELLED',
] as const;

export const IT_CHANGE_TYPES = ['STANDARD', 'NORMAL', 'EMERGENCY'] as const;
export const IT_RISKS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const IT_ENVIRONMENTS = ['PRODUCTION', 'STAGING', 'DEVELOPMENT'] as const;
export const IT_CHANGE_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'SCHEDULED',
  'IMPLEMENTED',
  'FAILED',
  'ROLLED_BACK',
] as const;

export const IT_INCIDENT_SEVERITIES = ['SEV1', 'SEV2', 'SEV3', 'SEV4'] as const;
export const IT_INCIDENT_CATEGORIES = [
  'OUTAGE',
  'NETWORK',
  'SECURITY',
  'APPLICATION',
  'HARDWARE',
  'OTHER',
] as const;
export const IT_INCIDENT_STATUSES = [
  'INVESTIGATING',
  'IDENTIFIED',
  'MONITORING',
  'RESOLVED',
  'CLOSED',
] as const;
/** The statuses in which an incident is no longer being worked. */
export const IT_INCIDENT_DONE: ReadonlySet<string> = new Set(['RESOLVED', 'CLOSED']);

export const IT_VULN_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export const IT_VULN_SOURCES = ['SCAN', 'PENTEST', 'VENDOR_ADVISORY', 'REPORT'] as const;
export const IT_VULN_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'MITIGATED',
  'RESOLVED',
  'ACCEPTED',
] as const;

export const IT_NETWORK_KINDS = [
  'WIFI',
  'VPN',
  'FIREWALL',
  'DNS',
  'IP_RANGE',
  'ROUTER',
  'SWITCH',
  'OTHER',
] as const;
export const IT_CLOUD_KINDS = [
  'SERVER',
  'DOCKER_HOST',
  'KUBERNETES',
  'DATABASE',
  'DOMAIN',
  'SSL_CERTIFICATE',
  'STORAGE',
  'OTHER',
] as const;
/** Shared by the network and cloud registers: is the thing up. */
export const IT_SERVICE_STATUSES = ['ACTIVE', 'DEGRADED', 'DOWN', 'RETIRED'] as const;

export const IT_PURCHASE_KINDS = ['HARDWARE', 'SOFTWARE', 'SERVICE'] as const;
export const IT_PURCHASE_STATUSES = [
  'REQUESTED',
  'QUOTED',
  'APPROVED',
  'REJECTED',
  'ORDERED',
  'RECEIVED',
  'CANCELLED',
] as const;
