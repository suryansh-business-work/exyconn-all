import type { ListAiModelPricesQuery } from '@exyconn/shell/graphql/generated';

export type AiModelPriceRow = ListAiModelPricesQuery['listAiModelPrices'][number];

/** Exactly what the pricing form collects. Prices are USD per 1,000 tokens. */
export interface AiModelPriceFormValues {
  model: string;
  inputPer1kUsd: number;
  outputPer1kUsd: number;
  active: 'true' | 'false';
}
