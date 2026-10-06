import { z } from 'zod';
import type { PropNode } from './props-tree';

/** Form: the props edited as fields, or as raw JSON. */
export type PropsEditMode = 'fields' | 'json';

export interface PropsFormValues {
  mode: PropsEditMode;
  tree: PropNode;
  json: string;
}

/** Placeholders are attributes in the page's HTML; a runaway paste would bloat every save. */
const MAX_JSON = 200_000;

const parsesToObject = (text: string): boolean => {
  try {
    const value: unknown = JSON.parse(text);
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  } catch {
    return false;
  }
};

export const propsFormSchema = z
  .object({
    mode: z.enum(['fields', 'json']),
    tree: z.custom<PropNode>((value) => value !== null && typeof value === 'object'),
    json: z.string().max(MAX_JSON, 'These settings are too large'),
  })
  .refine((values) => values.mode === 'fields' || parsesToObject(values.json), {
    path: ['json'],
    message: 'Enter a JSON object, like { "title": "Hello" }',
  });
