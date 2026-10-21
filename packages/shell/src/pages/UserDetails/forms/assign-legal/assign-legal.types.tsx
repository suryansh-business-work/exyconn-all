import { z } from 'zod';
import type { LegalAssignablesQuery, LegalItemKind } from '@/graphql/generated';

/** The most items one assignment may hand over; the server refuses more. */
export const MAX_ASSIGN_ITEMS = 100;

/** One contract, policy or document that can be handed over, as the server lists it. */
export type LegalAssignableRow = LegalAssignablesQuery['legalAssignables'][number];

/** An item's key in the form: its kind and id, so two kinds cannot collide. */
export const itemKey = (item: { kind: LegalItemKind; id: string }) => `${item.kind}:${item.id}`;

export const assignLegalSchema = z.object({
  items: z
    .array(z.string())
    .min(1, 'Choose at least one contract, policy or document')
    .max(MAX_ASSIGN_ITEMS, `Choose at most ${MAX_ASSIGN_ITEMS} items at a time`),
});

export type AssignLegalFormValues = z.infer<typeof assignLegalSchema>;

/** The form's keys back as the mutation's items. */
export function toAssignItems(keys: readonly string[], rows: readonly LegalAssignableRow[]) {
  const byKey = new Map(rows.map((row) => [itemKey(row), row]));
  return keys.flatMap((key) => {
    const row = byKey.get(key);
    return row ? [{ kind: row.kind, itemId: row.id }] : [];
  });
}
