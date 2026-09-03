import { ProblemCategory, ProblemSeverity, ProblemStatus } from '@exyconn/shell/graphql/generated';

/** Mirrors the server enums so triage offers exactly what the schema accepts. */
export const PROBLEM_CATEGORIES = Object.values(ProblemCategory);
export const PROBLEM_SEVERITIES = Object.values(ProblemSeverity);
export const PROBLEM_STATUSES = Object.values(ProblemStatus);
