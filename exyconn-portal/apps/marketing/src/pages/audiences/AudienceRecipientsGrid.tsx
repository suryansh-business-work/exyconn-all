import type { TypedDocumentNode } from '@apollo/client';
import { useCallback } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import type { GridFetcher } from '@exyconn/shell/components/data/ServerDataGrid.types';
import {
  AudienceResolutionRecipientsDocument,
  PreviewAudienceRecipientsDocument,
  type AudienceListInput,
  type AudienceResolutionRecipientsQuery,
  type AudienceResolutionRecipientsQueryVariables,
  type PreviewAudienceRecipientsQuery,
  type PreviewAudienceRecipientsQueryVariables,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { RECIPIENT_COLUMNS, type RecipientRow } from './audience-recipients-grid';

const audienceResolutionRecipientsQuery: TypedDocumentNode<
  AudienceResolutionRecipientsQuery,
  AudienceResolutionRecipientsQueryVariables
> = AudienceResolutionRecipientsDocument;
const previewAudienceRecipientsQuery: TypedDocumentNode<
  PreviewAudienceRecipientsQuery,
  PreviewAudienceRecipientsQueryVariables
> = PreviewAudienceRecipientsDocument;

/** Either a saved audience (its snapshot honoured) or the form's unsaved settings. */
export type RecipientsTarget = { audienceId: string } | { draft: AudienceListInput };

interface AudienceRecipientsGridProps {
  target: RecipientsTarget;
}

/** Server-paged recipients of an audience, searched by address, name or company. */
export function AudienceRecipientsGrid({ target }: Readonly<AudienceRecipientsGridProps>) {
  const client = useApolloClient();
  const targetKey = JSON.stringify(target);
  const fetchRows: GridFetcher<RecipientRow> = useCallback(
    async (page: TableQueryInput) => {
      const parsed = JSON.parse(targetKey) as RecipientsTarget;
      if ('audienceId' in parsed) {
        const { data } = await client.query({
          query: audienceResolutionRecipientsQuery,
          variables: { id: parsed.audienceId, page },
          fetchPolicy: 'network-only',
        });
        return data?.audienceResolution.recipients ?? { rows: [], totalCount: 0 };
      }
      const { data } = await client.query({
        query: previewAudienceRecipientsQuery,
        variables: { input: parsed.draft, page },
        fetchPolicy: 'network-only',
      });
      return data?.previewAudience.recipients ?? { rows: [], totalCount: 0 };
    },
    [client, targetKey],
  );
  return (
    <ServerDataGrid
      columnDefs={RECIPIENT_COLUMNS}
      fetchRows={fetchRows}
      searchPlaceholder="Search email, contact or company…"
      height={480}
    />
  );
}
