import { badRequest } from '../../../utils/errors';
import type { CrmObject } from './crm.objects';
import { customProperties } from './crm.schema';
import { coerceValue } from './crm.values';

/**
 * The custom values a form sends, made safe to store: only the company's own properties, each
 * read as its type, required ones present. Blank values are left out rather than stored empty.
 */
export async function sanitizeCustom(
  object: CrmObject,
  raw: unknown,
): Promise<Record<string, unknown>> {
  const values = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const properties = new Map((await customProperties(object)).map((p) => [p.key, p]));
  const unknownKey = Object.keys(values).find((key) => !properties.has(key));
  if (unknownKey) {
    badRequest(`There is no property "${unknownKey}"`);
  }
  const custom: Record<string, unknown> = {};
  for (const property of properties.values()) {
    const result = coerceValue(property, (values as Record<string, unknown>)[property.key]);
    if (!result.ok) {
      badRequest(result.error);
    }
    if (result.value === null) {
      if (property.required) {
        badRequest(`${property.label} is required`);
      }
      continue;
    }
    custom[property.key] = result.value;
  }
  return custom;
}
