import type {
  ListEmployeeDocumentsPagedQuery,
  DocumentKind,
} from '@exyconn/shell/graphql/generated';

export type EmployeeDocumentRow =
  ListEmployeeDocumentsPagedQuery['listEmployeeDocumentsPaged']['rows'][number];

export interface EmployeeDocumentFormValues {
  employeeId: string;
  kind: DocumentKind;
  title: string;
  url: string;
  issuedOn: string;
}
