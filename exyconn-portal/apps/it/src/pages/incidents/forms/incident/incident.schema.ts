import { z } from 'zod';
import {
  ItIncidentCategory,
  ItIncidentSeverity,
  ItIncidentStatus,
} from '@exyconn/shell/graphql/generated';
import type { IncidentRow } from './incident.types';

/** Once an incident is over, its review has to say what caused it. */
const FINISHED = new Set<ItIncidentStatus>([ItIncidentStatus.Resolved, ItIncidentStatus.Closed]);

const followUpSchema = z.object({
  title: z.string().trim().min(3, 'Say what has to be done').max(200, 'Too long'),
  ownerName: z.string().trim().max(120, 'Too long'),
  dueAt: z.string(),
  done: z.boolean(),
});

export const incidentSchema = z
  .object({
    title: z.string().trim().min(4, 'Give the incident a title').max(160, 'Too long'),
    description: z.string().trim().min(10, 'Describe what is happening').max(4000, 'Too long'),
    severity: z.nativeEnum(ItIncidentSeverity),
    category: z.nativeEnum(ItIncidentCategory),
    status: z.nativeEnum(ItIncidentStatus),
    startedAt: z.string().min(1, 'When did it start?'),
    impact: z.string().trim().max(2000, 'Too long'),
    affectedSystems: z.array(z.string().trim().min(1)),
    commanderName: z.string().trim().max(120, 'Too long'),
    rootCause: z.string().trim().max(4000, 'Too long'),
    followUps: z.array(followUpSchema),
  })
  .refine((v) => !FINISHED.has(v.status) || v.rootCause.length > 0, {
    message: 'A resolved incident needs its root cause written down',
    path: ['rootCause'],
  });

export type IncidentValues = z.infer<typeof incidentSchema>;

/** An empty follow-up date means "no date", which the API spells null. */
export function toIncidentInput(values: IncidentValues) {
  return {
    ...values,
    followUps: values.followUps.map((followUp) => ({
      ...followUp,
      dueAt: followUp.dueAt || null,
    })),
  };
}

export function toIncidentValues(row: IncidentRow | null): IncidentValues {
  return {
    title: row?.title ?? '',
    description: row?.description ?? '',
    severity: row?.severity ?? ItIncidentSeverity.Sev3,
    category: row?.category ?? ItIncidentCategory.Outage,
    status: row?.status ?? ItIncidentStatus.Investigating,
    startedAt: row?.startedAt ?? new Date().toISOString(),
    impact: row?.impact ?? '',
    affectedSystems: row?.affectedSystems ?? [],
    commanderName: row?.commanderName ?? '',
    rootCause: row?.rootCause ?? '',
    followUps: (row?.followUps ?? []).map((followUp) => ({
      title: followUp.title,
      ownerName: followUp.ownerName,
      dueAt: followUp.dueAt ?? '',
      done: followUp.done,
    })),
  };
}
