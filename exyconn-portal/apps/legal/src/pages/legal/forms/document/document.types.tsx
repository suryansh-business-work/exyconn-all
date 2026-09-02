import type { ListLegalDocumentsQuery } from '@exyconn/shell/graphql/generated';

export type LegalDocumentRow = ListLegalDocumentsQuery['listLegalDocuments'][number];
