/**
 * What a form's Zod schema says about one field: whether it must be filled in, and the hint
 * written for it with `.describe()`.
 *
 * Read from the schema the form already validates with, so the red star and the rule can
 * never disagree — a field is starred exactly when leaving it empty is refused.
 */
export interface FieldMeta {
  required: boolean;
  description?: string;
}

/** The parts of a Zod 4 schema this reads. Internal to Zod, so kept deliberately narrow. */
interface ZodLike {
  description?: string;
  _zod: { def: ZodDef };
}

interface ZodDef {
  type: string;
  shape?: Record<string, ZodLike>;
  innerType?: ZodLike;
  in?: ZodLike;
  options?: ZodLike[];
  values?: unknown[];
  element?: ZodLike;
  format?: string;
  checks?: { _zod: { def: { check: string; minimum?: number } } }[];
}

const NOT_FOUND: FieldMeta = { required: false };

/** Wrappers that make an empty value acceptable. */
const OPTIONAL_WRAPPERS: ReadonlySet<string> = new Set([
  'optional',
  'nullable',
  'default',
  'prefault',
  'catch',
]);
/** Wrappers that change nothing about whether a value is required. */
const TRANSPARENT_WRAPPERS: ReadonlySet<string> = new Set(['readonly', 'nonoptional', 'lazy']);
/** Types whose empty state is a real answer, so they are never starred. */
const NEVER_REQUIRED: ReadonlySet<string> = new Set(['boolean', 'any', 'unknown', 'undefined']);

const isZod = (value: unknown): value is ZodLike =>
  typeof value === 'object' && value !== null && '_zod' in value;

/** At least `minimum` items or characters. */
function minimumOf(def: ZodDef): number {
  const checks = def.checks ?? [];
  return Math.max(
    0,
    ...checks
      .filter((check) => check._zod.def.check === 'min_length')
      .map((check) => check._zod.def.minimum ?? 0),
  );
}

/** A string that refuses ''. A format (e-mail, a pattern) refuses it as surely as a length. */
function stringRequired(def: ZodDef): boolean {
  const formatted = (def.checks ?? []).some((check) => check._zod.def.check === 'string_format');
  return minimumOf(def) > 0 || formatted || Boolean(def.format);
}

/** Whether leaving this schema's value empty is refused. */
function requiredOf(schema: ZodLike): boolean {
  const def = schema._zod.def;
  if (OPTIONAL_WRAPPERS.has(def.type) || NEVER_REQUIRED.has(def.type)) {
    return false;
  }
  if (TRANSPARENT_WRAPPERS.has(def.type) && def.innerType) {
    return requiredOf(def.innerType);
  }
  switch (def.type) {
    case 'string':
      return stringRequired(def);
    case 'array':
      return minimumOf(def) > 0;
    case 'pipe':
      return def.in ? requiredOf(def.in) : false;
    case 'literal':
      return !(def.values ?? []).some((value) => value === '' || value == null);
    case 'union':
      // `.or(z.literal(''))` and the like: one empty-accepting option makes it optional.
      return (def.options ?? []).every(requiredOf);
    default:
      return true;
  }
}

/** The object or array a path step reads from, looking through wrappers on the way down. */
function unwrapToContainer(schema: ZodLike): ZodLike | undefined {
  const def = schema._zod.def;
  if (def.type === 'object' || def.type === 'array') {
    return schema;
  }
  const inner = def.innerType ?? def.in;
  return inner ? unwrapToContainer(inner) : undefined;
}

/** One step down: an object's field, or (for a numeric key) an array's item. */
function childOf(container: ZodLike, key: string): ZodLike | undefined {
  const def = container._zod.def;
  return def.type === 'array' ? def.element : def.shape?.[key];
}

/** The schema at an RHF path ("socialLinks.github", "items.0.name"), if it has one. */
function schemaAt(schema: ZodLike, path: string): ZodLike | undefined {
  let current: ZodLike | undefined = schema;
  for (const key of path.split('.')) {
    const container: ZodLike | undefined = current ? unwrapToContainer(current) : undefined;
    current = container ? childOf(container, key) : undefined;
  }
  return current;
}

/** The hint written on a field, on the field itself or on any wrapper around it. */
function descriptionOf(schema: ZodLike | undefined): string | undefined {
  let current = schema;
  while (current) {
    if (current.description) {
      return current.description;
    }
    const def: ZodDef = current._zod.def;
    current = def.innerType ?? def.in;
  }
  return undefined;
}

/** What `schema` says about the field at `path`. Unknown schemas and paths say nothing. */
export function fieldMeta(schema: unknown, path: string): FieldMeta {
  if (!isZod(schema)) {
    return NOT_FOUND;
  }
  const field = schemaAt(schema, path);
  if (!field) {
    return NOT_FOUND;
  }
  return { required: requiredOf(field), description: descriptionOf(field) };
}
