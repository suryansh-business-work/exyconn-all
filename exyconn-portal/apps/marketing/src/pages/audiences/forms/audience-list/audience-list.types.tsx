import type { AudienceListFieldsFragment, AudienceSegment } from '@exyconn/shell/graphql/generated';
import { CompanyStatus } from '@exyconn/shell/graphql/generated';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';

export type AudienceRow = AudienceListFieldsFragment;

/** The parameter the CONTACTS_BY_COMPANY_STATUS rule takes, from the CRM's own enum. */
export const COMPANY_STATUS_OPTIONS: SelectOption[] = enumOptions(Object.values(CompanyStatus));

export interface AudienceListFormValues {
  name: string;
  description: string;
  clientIds: string[];
  contactIds: string[];
  dynamicSegment: AudienceSegment;
  segmentValue: string;
}
