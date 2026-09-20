import { z } from 'zod';
import {
  ComplianceCategory,
  FindingSource,
  FindingStatus,
  FindingType,
  ManagementStandard,
} from '@exyconn/shell/graphql/generated';
import type { FindingRow } from './finding.types';

/** "Was it effective?" has three answers until somebody has checked: yes, no, and not yet. */
export const EFFECTIVE_UNANSWERED = '';
export const EFFECTIVE_YES = 'YES';
export const EFFECTIVE_NO = 'NO';

export const findingSchema = z
  .object({
    title: z.string().trim().min(1, 'Say what was found'),
    description: z.string().trim(),
    source: z.nativeEnum(FindingSource),
    auditId: z.string().trim(),
    riskId: z.string().trim(),
    standards: z.array(z.nativeEnum(ManagementStandard)).min(1, 'Pick at least one standard'),
    category: z.nativeEnum(ComplianceCategory),
    clause: z.string().trim(),
    type: z.nativeEnum(FindingType),
    immediateAction: z.string().trim(),
    rootCause: z.string().trim(),
    correctiveAction: z.string().trim(),
    ownerId: z.string().trim(),
    ownerName: z.string().trim().min(1, 'Somebody has to own putting it right'),
    raisedOn: z.date({ message: 'Say when it was raised' }),
    dueOn: z.date().nullable(),
    status: z.nativeEnum(FindingStatus),
    verifiedOn: z.date().nullable(),
    verifiedByName: z.string().trim(),
    effective: z.enum([EFFECTIVE_UNANSWERED, EFFECTIVE_YES, EFFECTIVE_NO]),
    effectivenessNote: z.string().trim(),
    // What proves it. Unvalidated beyond its shape: the picker has already uploaded each
    // file and holds only the URL it got back.
    evidence: z.array(
      z.object({ url: z.string(), name: z.string(), contentType: z.string() }),
    ),
  })
  // The server refuses this too (clause 10.2 ends on whether the action WORKED); catching it
  // here means the answer arrives while the person still has the verification fields open.
  .refine(
    (values) =>
      values.status !== FindingStatus.Closed ||
      (values.verifiedOn !== null && values.effective !== EFFECTIVE_UNANSWERED),
    {
      message: 'A finding closes once its corrective action has been verified',
      path: ['verifiedOn'],
    },
  );

type Values = z.infer<typeof findingSchema>;

/** The three-way "effective" answer goes back as a boolean, or null for "not yet checked". */
function effectiveOf(answer: string): boolean | null {
  if (answer === EFFECTIVE_UNANSWERED) {
    return null;
  }
  return answer === EFFECTIVE_YES;
}

export function toFindingInput(values: Values) {
  return {
    ...values,
    raisedOn: values.raisedOn.toISOString(),
    dueOn: values.dueOn ? values.dueOn.toISOString() : null,
    verifiedOn: values.verifiedOn ? values.verifiedOn.toISOString() : null,
    effective: effectiveOf(values.effective),
    evidence: values.evidence,
    closedOn: values.status === FindingStatus.Closed ? new Date().toISOString() : null,
  };
}

function answerOf(effective: boolean | null | undefined): Values['effective'] {
  if (effective === null || effective === undefined) {
    return EFFECTIVE_UNANSWERED;
  }
  return effective ? EFFECTIVE_YES : EFFECTIVE_NO;
}

export function toFindingValues(row: FindingRow | null): Values {
  return {
    title: row?.title ?? '',
    description: row?.description ?? '',
    source: row?.source ?? FindingSource.InternalAudit,
    auditId: row?.auditId ?? '',
    riskId: row?.riskId ?? '',
    standards: row?.standards ?? [],
    category: row?.category ?? ComplianceCategory.Quality,
    clause: row?.clause ?? '',
    type: row?.type ?? FindingType.MinorNonconformity,
    immediateAction: row?.immediateAction ?? '',
    rootCause: row?.rootCause ?? '',
    correctiveAction: row?.correctiveAction ?? '',
    ownerId: row?.ownerId ?? '',
    ownerName: row?.ownerName ?? '',
    raisedOn: row ? new Date(row.raisedOn) : new Date(),
    dueOn: row?.dueOn ? new Date(row.dueOn) : null,
    status: row?.status ?? FindingStatus.Open,
    verifiedOn: row?.verifiedOn ? new Date(row.verifiedOn) : null,
    verifiedByName: row?.verifiedByName ?? '',
    effective: answerOf(row?.effective),
    effectivenessNote: row?.effectivenessNote ?? '',
    evidence: (row?.evidence ?? []).map((file) => ({
      url: file.url,
      name: file.name,
      contentType: file.contentType,
    })),
  };
}
