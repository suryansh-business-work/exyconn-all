/**
 * The vocabulary every compliance record shares.
 *
 * One set of screens serves all four management systems rather than four near-identical
 * modules: a risk, an objective, an audit and a corrective action are the same artefacts in
 * ISO 9001, 27001, 45001 and 14001, and a company certified to more than one standard keeps
 * ONE register with each record saying which standards it answers to.
 */
export const MANAGEMENT_STANDARDS = ['ISO_9001', 'ISO_27001', 'ISO_45001', 'ISO_14001'] as const;
export type ManagementStandard = (typeof MANAGEMENT_STANDARDS)[number];

/** What a risk or an objective is about — the same list across the standards. */
export const COMPLIANCE_CATEGORIES = [
  'QUALITY',
  'INFORMATION_SECURITY',
  'HEALTH_SAFETY',
  'ENVIRONMENT',
  'OPERATIONAL',
  'LEGAL',
  'FINANCIAL',
  'SUPPLIER',
  'PEOPLE',
] as const;
export type ComplianceCategory = (typeof COMPLIANCE_CATEGORIES)[number];

/** How a risk is being dealt with (ISO 31000's four options). */
export const RISK_TREATMENTS = ['REDUCE', 'AVOID', 'TRANSFER', 'ACCEPT'] as const;

export const RISK_STATUSES = ['IDENTIFIED', 'TREATING', 'MONITORING', 'CLOSED'] as const;

/** Where a risk rating lands, once likelihood and impact are multiplied. */
export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/** Both axes are scored 1–5, so a rating runs 1–25. */
export const RISK_SCALE_MIN = 1;
export const RISK_SCALE_MAX = 5;

/**
 * The bands a 1–25 rating falls into. Stated once here because the register, the dashboard
 * and any report have to agree about what "high" means, and an auditor will ask.
 */
export function riskLevel(score: number): RiskLevel {
  if (score >= 15) return 'CRITICAL';
  if (score >= 10) return 'HIGH';
  if (score >= 5) return 'MEDIUM';
  return 'LOW';
}

export const OBJECTIVE_SCOPES = ['COMPANY', 'DEPARTMENT', 'PROCESS'] as const;

export const OBJECTIVE_FREQUENCIES = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'] as const;

export const OBJECTIVE_STATUSES = ['PLANNED', 'ON_TRACK', 'AT_RISK', 'MET', 'MISSED'] as const;

/**
 * How far an objective has got, as a percentage of the distance from its baseline to its
 * target — not of the target itself, which would read 90% before any work was done on a
 * measure that started at 90.
 *
 * Works in both directions: a target BELOW the baseline (fewer incidents, less waste) is
 * progress when the actual falls. A target equal to the baseline asks for no movement, so it
 * is met as soon as the actual reaches it.
 */
export function objectiveAchievement(baseline: number, target: number, actual: number): number {
  const distance = target - baseline;
  if (distance === 0) {
    const met = target >= 0 ? actual >= target : actual <= target;
    return met ? 100 : 0;
  }
  const moved = (actual - baseline) / distance;
  return Math.max(0, Math.min(100, Math.round(moved * 100)));
}
