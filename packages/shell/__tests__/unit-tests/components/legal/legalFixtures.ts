import { LegalItemKind } from '@/graphql/generated';

export const PART_TIME = { id: 'g1', name: 'Part Time Employee Contracts' };

/** A group as ListLegalGroups returns it. */
export const group = (id: string, name: string, kind: LegalItemKind, description = '') => ({
  __typename: 'LegalGroup' as const,
  id,
  name,
  kind,
  description,
});

/** An item that can be handed over, as LegalAssignables returns it. */
export const assignable = (
  id: string,
  kind: LegalItemKind,
  title: string,
  inGroup: { id: string; name: string } | null = null,
) => ({
  __typename: 'LegalAssignable' as const,
  id,
  kind,
  title,
  status: 'ACTIVE',
  groupId: inGroup?.id ?? null,
  groupName: inGroup?.name ?? null,
});

/** An item handed to somebody, as the assignment queries return it. */
export const assignment = (
  id: string,
  itemId: string,
  title: string,
  patch: Partial<{
    kind: LegalItemKind;
    groupName: string | null;
    fileUrl: string;
    hasBody: boolean;
  }> = {},
) => ({
  __typename: 'LegalAssignment' as const,
  id,
  kind: LegalItemKind.Contract,
  itemId,
  title,
  status: 'ACTIVE',
  groupName: null,
  fileUrl: '',
  hasBody: true,
  assignedByName: 'Hema HR',
  assignedAt: '2026-10-01T09:00:00.000Z',
  ...patch,
});
