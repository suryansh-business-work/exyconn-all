import { describe, expect, it } from 'vitest';
import { LegalItemKind } from '@/graphql/generated';
import {
  MAX_ASSIGN_ITEMS,
  assignLegalSchema,
  itemKey,
  toAssignItems,
} from '@/pages/UserDetails/forms/assign-legal';
import { assignable } from '../../../components/legal/legalFixtures';

const OFFER = assignable('c1', LegalItemKind.Contract, 'Part-time offer');

describe('the assign form values', () => {
  it('keys an item by its kind and id', () => {
    expect(itemKey(OFFER)).toBe('CONTRACT:c1');
  });

  it('turns the chosen keys back into items, skipping any no longer listed', () => {
    expect(toAssignItems(['CONTRACT:c1', 'POLICY:gone'], [OFFER])).toEqual([
      { kind: LegalItemKind.Contract, itemId: 'c1' },
    ]);
  });

  it('asks for between one and the most items one assignment may hand over', () => {
    expect(assignLegalSchema.safeParse({ items: [] }).success).toBe(false);
    expect(assignLegalSchema.safeParse({ items: ['CONTRACT:c1'] }).success).toBe(true);
    const tooMany = Array.from({ length: MAX_ASSIGN_ITEMS + 1 }, (_, i) => `CONTRACT:${i}`);
    expect(assignLegalSchema.safeParse({ items: tooMany }).error?.issues[0].message).toBe(
      `Choose at most ${MAX_ASSIGN_ITEMS} items at a time`,
    );
  });
});
