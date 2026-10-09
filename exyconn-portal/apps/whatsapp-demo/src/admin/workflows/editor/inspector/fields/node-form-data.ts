/**
 * The bridge between a node's stored data and its inspector form.
 *
 * Stored `set` maps (`{ fee: '$price:650' }`) are edited as key/value rows, which React Hook
 * Form can hold in a field array; the resolver turns them back into maps and then validates
 * with the node's own `NODE_SCHEMAS` entry, so the form enforces exactly what the server does.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldValues, Resolver } from 'react-hook-form';
import type { z } from 'zod';

export interface SetRow {
  key: string;
  value: string;
}

/** Optional fields whose empty value means "not set" — stripped so the stored data stays clean. */
const OPTIONAL_TEXT = new Set([
  'header',
  'footer',
  'description',
  'subtitle',
  'badge',
  'buttonTitle',
  'payTitle',
  'caption',
  'prompt',
  'error',
  'retry',
  'role',
  'organisation',
  'note',
  'heading',
  'title',
  'location',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function mapDeep(value: unknown, entry: (key: string, child: unknown) => unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => mapDeep(item, entry));
  }
  if (!isRecord(value)) {
    return value;
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, entry(key, child)]));
}

/** Stored data → form values: every `set` map becomes rows. */
export function toFormValues(data: unknown): FieldValues {
  const convert = (key: string, child: unknown): unknown => {
    if (key === 'set' && isRecord(child)) {
      return Object.entries(child).map(([k, v]) => ({ key: k, value: String(v) }));
    }
    return mapDeep(child, convert);
  };
  return mapDeep(data, convert) as FieldValues;
}

/** Form values → stored data: rows become `set` maps again (blank keys dropped). */
export function fromFormValues(values: unknown): unknown {
  const convert = (key: string, child: unknown): unknown => {
    if (key === 'set' && Array.isArray(child)) {
      const rows = (child as SetRow[]).filter((row) => row.key.trim() !== '');
      return rows.length > 0
        ? Object.fromEntries(rows.map((row) => [row.key.trim(), row.value]))
        : undefined;
    }
    return mapDeep(child, convert);
  };
  return mapDeep(values, convert);
}

/** Drops empty optional text and `undefined` keys from validated data. */
export function compact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(compact);
  }
  if (!isRecord(value)) {
    return value;
  }
  const kept = Object.entries(value).filter(
    ([key, child]) => child !== undefined && !(child === '' && OPTIONAL_TEXT.has(key)),
  );
  return Object.fromEntries(kept.map(([key, child]) => [key, compact(child)]));
}

/** The same data whatever order its keys were added in, so two copies compare as text. */
const canonical = (value: unknown): string =>
  JSON.stringify(compact(fromFormValues(value)), (_key, child) =>
    isRecord(child)
      ? Object.fromEntries(Object.entries(child).sort(([a], [b]) => a.localeCompare(b)))
      : child,
  );

/**
 * Whether Apply would hand the canvas something different from `baseline`. React Hook Form's
 * own `isDirty` cannot say: once a form has been reset, the empty values its fields register
 * (an unset note, an empty `set` list) are keys the defaults lack, so it reads dirty for good.
 */
export function hasChanges(values: unknown, baseline: unknown): boolean {
  return canonical(values) !== canonical(baseline);
}

const tooSmallMessage = (origin: string, minimum: number | bigint) => {
  if (origin === 'string') {
    return Number(minimum) <= 1 ? 'This is required' : 'Too short';
  }
  return origin === 'array' ? 'Add at least one' : 'Too small';
};

const tooBigMessage = (origin: string) => {
  if (origin === 'string') {
    return 'Too long for WhatsApp';
  }
  return origin === 'array' ? 'Too many items' : 'Too large';
};

/** Plain-English messages for the schema's limits; the field translates them. */
const formError: z.core.$ZodErrorMap = (issue) => {
  if (issue.code === 'too_small') {
    return tooSmallMessage(issue.origin, issue.minimum);
  }
  if (issue.code === 'too_big') {
    return tooBigMessage(issue.origin);
  }
  if (issue.code === 'invalid_type') {
    return issue.input === undefined ? 'This is required' : 'Enter a valid value';
  }
  return undefined;
};

/** Validates the form against a node's data schema, returning the stored shape. */
export function nodeResolver(schema: z.ZodType): Resolver<FieldValues> {
  const inner = zodResolver(schema as z.ZodType<FieldValues, FieldValues>, { error: formError });
  return (values, context, options) =>
    inner(fromFormValues(values) as FieldValues, context, options);
}
