import type { SocialAppConfigsQuery } from '@exyconn/shell/graphql/generated';

export type SocialAppRow = SocialAppConfigsQuery['socialAppConfigs'][number];

export interface SocialAppFormValues {
  clientId: string;
  /** Write-only: blank keeps the stored secret. */
  clientSecret: string;
  enabled: boolean;
}
