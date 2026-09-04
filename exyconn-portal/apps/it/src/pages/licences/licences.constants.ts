import { LicenceBillingCycle, LicenceStatus } from '@exyconn/shell/graphql/generated';

/** Mirrors the server enums so the form offers exactly what the schema accepts. */
export const LICENCE_BILLING_CYCLES = Object.values(LicenceBillingCycle);
export const LICENCE_STATUSES = Object.values(LicenceStatus);

/** How far ahead a renewal counts as "coming up" on the dashboard. */
export const RENEWAL_WINDOW_DAYS = 30;
