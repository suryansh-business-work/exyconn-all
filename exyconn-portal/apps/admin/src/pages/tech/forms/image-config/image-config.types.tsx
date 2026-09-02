import type { ListImageConfigsQuery } from '@exyconn/shell/graphql/generated';

export type ImageConfigRow = ListImageConfigsQuery['listImageConfigs'][number];

export interface ImageConfigFormValues {
  label: string;
  provider: string;
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
  isActive: 'true' | 'false';
}
