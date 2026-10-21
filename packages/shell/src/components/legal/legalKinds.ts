import { LegalItemKind } from '@/graphql/generated';

/** How each register is named, singular and plural, wherever its items are listed. */
export const LEGAL_KIND_LABELS: Readonly<Record<LegalItemKind, { one: string; many: string }>> = {
  [LegalItemKind.Contract]: { one: 'Contract', many: 'Contracts' },
  [LegalItemKind.Policy]: { one: 'Policy', many: 'Policies' },
  [LegalItemKind.Document]: { one: 'Document', many: 'Documents' },
};

/** The registers in the order they are shown. */
export const LEGAL_KINDS: readonly LegalItemKind[] = [
  LegalItemKind.Contract,
  LegalItemKind.Policy,
  LegalItemKind.Document,
];
