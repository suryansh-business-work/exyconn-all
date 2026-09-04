import type { DocPageQuery } from '@exyconn/shell/graphql/generated';

/** A page with its body — what the editor loads and writes back. */
export type DocPageRow = DocPageQuery['docPage'];

export interface DocPageFormValues {
  title: string;
  body: string;
}
