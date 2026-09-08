import { IncidentImpact, IncidentUpdateStatus } from '@exyconn/shell/graphql/generated';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';

/** Mirrors the server enums so the forms offer exactly what the schema accepts. */
export const IMPACT_OPTIONS = enumOptions(Object.values(IncidentImpact));
export const UPDATE_STATUS_OPTIONS = enumOptions(Object.values(IncidentUpdateStatus));

/** Route the tabs live under; each tab is a slug beneath it. */
export const INCIDENTS_PATH = '/tech/incidents';
