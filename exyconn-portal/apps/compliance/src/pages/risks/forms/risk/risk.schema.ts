import { z } from 'zod';
import {
  ComplianceCategory,
  ManagementStandard,
  RiskStatus,
  RiskTreatment,
} from '@exyconn/shell/graphql/generated';
import type { RiskRow } from './risk.types';

/** Both axes are scored 1-5; the picker sends the number as a string, as selects do. */
const scale = (label: string) =>
  z
    .string()
    .refine((value) => ['1', '2', '3', '4', '5'].includes(value), `${label} is scored 1 to 5`);

export const riskSchema = z.object({
  title: z.string().trim().min(1, 'Say what the risk is'),
  description: z.string().trim(),
  // A risk that answers to no standard would never appear in the report an auditor asks for.
  standards: z.array(z.nativeEnum(ManagementStandard)).min(1, 'Pick at least one standard'),
  category: z.nativeEnum(ComplianceCategory),
  subject: z.string().trim(),
  ownerId: z.string().trim(),
  ownerName: z.string().trim().min(1, 'A risk with no owner is a note, not a risk'),
  likelihood: scale('Likelihood'),
  impact: scale('Impact'),
  treatment: z.nativeEnum(RiskTreatment),
  controls: z.string().trim(),
  residualLikelihood: scale('Residual likelihood'),
  residualImpact: scale('Residual impact'),
  status: z.nativeEnum(RiskStatus),
  identifiedOn: z.date({ message: 'Say when it was identified' }),
  reviewDueOn: z.date().nullable(),
});

type Values = z.infer<typeof riskSchema>;

/** Maps the validated values onto the GraphQL input; the scores go back as numbers. */
export function toRiskInput(values: Values) {
  return {
    ...values,
    likelihood: Number(values.likelihood),
    impact: Number(values.impact),
    residualLikelihood: Number(values.residualLikelihood),
    residualImpact: Number(values.residualImpact),
    identifiedOn: values.identifiedOn.toISOString(),
    reviewDueOn: values.reviewDueOn ? values.reviewDueOn.toISOString() : null,
  };
}

export function toRiskValues(row: RiskRow | null): Values {
  return {
    title: row?.title ?? '',
    description: row?.description ?? '',
    standards: row?.standards ?? [],
    category: row?.category ?? ComplianceCategory.Operational,
    subject: row?.subject ?? '',
    ownerId: row?.ownerId ?? '',
    ownerName: row?.ownerName ?? '',
    likelihood: String(row?.likelihood ?? 3),
    impact: String(row?.impact ?? 3),
    treatment: row?.treatment ?? RiskTreatment.Reduce,
    controls: row?.controls ?? '',
    residualLikelihood: String(row?.residualLikelihood ?? 2),
    residualImpact: String(row?.residualImpact ?? 2),
    status: row?.status ?? RiskStatus.Identified,
    identifiedOn: row ? new Date(row.identifiedOn) : new Date(),
    reviewDueOn: row?.reviewDueOn ? new Date(row.reviewDueOn) : null,
  };
}
