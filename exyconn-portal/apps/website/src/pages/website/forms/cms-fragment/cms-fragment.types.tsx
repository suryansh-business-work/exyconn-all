import { z } from 'zod';
import {
  CmsFragmentKind,
  type CmsFragmentListFieldsFragment,
} from '@exyconn/shell/graphql/generated';

export type CmsFragmentRow = CmsFragmentListFieldsFragment;

export const fragmentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Keep the name under 100 characters'),
  kind: z.enum(CmsFragmentKind),
});

export type FragmentFormValues = z.infer<typeof fragmentSchema>;

export const FRAGMENT_KIND_OPTIONS = [
  { value: CmsFragmentKind.Header, label: 'Header — the top of every page' },
  { value: CmsFragmentKind.Footer, label: 'Footer — the bottom of every page' },
  { value: CmsFragmentKind.Section, label: 'Section — a block reused across pages' },
  { value: CmsFragmentKind.Snippet, label: 'Snippet — a small reusable piece' },
];
