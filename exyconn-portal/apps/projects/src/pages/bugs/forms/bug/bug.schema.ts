import { z } from 'zod';
import { HTTP_URL } from '@exyconn/regex';
import { BugSeverity, BugStatus } from '@exyconn/shell/graphql/generated';
import type { BugFormValues, BugRow } from './bug.types';

/** Visible text of a rich-text value, so an editor holding only empty tags counts as empty. */
const textOf = (html: string) => html.replaceAll(/<[^>]*>/g, '').trim();

const optionalLink = z
  .string()
  .trim()
  .max(2000, 'Keep the link under 2000 characters')
  .refine((value) => value === '' || HTTP_URL.test(value), {
    message: 'Enter a full link starting with https://',
  });

export const bugSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Keep the title under 200 characters'),
  description: z
    .string()
    .refine((html) => textOf(html).length > 0, { message: 'Description is required' })
    .refine((html) => textOf(html).length >= 10, {
      message: 'Add a little more detail (at least 10 characters)',
    }),
  stepsToReproduce: z.string(),
  publicLink: optionalLink,
  privateLink: optionalLink,
  attachments: z.array(z.object({ url: z.string(), name: z.string(), contentType: z.string() })),
  severity: z.enum(BugSeverity),
  status: z.enum(BugStatus),
  projectId: z.string().min(1, 'Project is required'),
  assigneeId: z.string(),
  dueDate: z.string(),
});
export type BugValues = z.infer<typeof bugSchema>;

export const toInitial = (row: BugRow | null): BugFormValues => ({
  title: row?.title ?? '',
  description: row?.description ?? '',
  stepsToReproduce: row?.stepsToReproduce ?? '',
  publicLink: row?.publicLink ?? '',
  privateLink: row?.privateLink ?? '',
  attachments: (row?.attachments ?? []).map(({ url, name, contentType }) => ({
    url,
    name,
    contentType,
  })),
  severity: row?.severity ?? BugSeverity.Medium,
  status: row?.status ?? BugStatus.Open,
  projectId: row?.projectId ?? '',
  assigneeId: row?.assigneeId ?? '',
  dueDate: row?.dueDate ?? '',
});

/** What the server stores: an empty assignee, steps or date goes up as "none". */
export const toInput = (values: BugValues) => ({
  ...values,
  stepsToReproduce: textOf(values.stepsToReproduce) ? values.stepsToReproduce : '',
  assigneeId: values.assigneeId || null,
  dueDate: values.dueDate || null,
});
