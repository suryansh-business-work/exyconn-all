import type { ListLegalDocumentsQuery } from '@/graphql/generated';

export type LegalDocumentRow = ListLegalDocumentsQuery['listLegalDocuments'][number];
