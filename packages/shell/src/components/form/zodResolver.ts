import { zodResolver as hookformZodResolver } from '@hookform/resolvers/zod';

/** Which schema each resolver validates with, so a field can read its own rules. */
const schemas = new WeakMap<object, unknown>();

/**
 * `@hookform/resolvers`' Zod resolver, remembering its schema. Every portal form uses this
 * one, which is what lets each field star itself and show its hint from the schema alone
 * (see useFieldMeta) instead of every form repeating `required` and `helperText`.
 */
export const zodResolver = ((...args: Parameters<typeof hookformZodResolver>) => {
  const resolver = hookformZodResolver(...args);
  schemas.set(resolver, args[0]);
  return resolver;
}) as typeof hookformZodResolver;

/** The schema a resolver from {@link zodResolver} validates with; undefined for any other. */
export function schemaOfResolver(resolver: unknown): unknown {
  return typeof resolver === 'function' ? schemas.get(resolver) : undefined;
}
