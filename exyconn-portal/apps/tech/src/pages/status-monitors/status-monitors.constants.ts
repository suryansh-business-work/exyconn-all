import { StatusCategory } from '@exyconn/shell/graphql/generated';

/** Mirrors the server enum so the form offers exactly what the schema accepts. */
export const STATUS_CATEGORIES = Object.values(StatusCategory);
