import type { TypedDocumentNode } from '@apollo/client';
import { useEffect, useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  PreviewCampaignContentDocument,
  type CampaignPreviewInput,
  type PreviewCampaignContentQuery,
  type PreviewCampaignContentQueryVariables,
} from '@exyconn/shell/graphql/generated';

const previewCampaignContentQuery: TypedDocumentNode<
  PreviewCampaignContentQuery,
  PreviewCampaignContentQueryVariables
> = PreviewCampaignContentDocument;

/** Long enough that typing compiles once per pause. */
const DEBOUNCE_MS = 500;

export type CampaignPreview = PreviewCampaignContentQuery['previewCampaignContent'];

export interface CampaignPreviewState {
  preview: CampaignPreview | null;
  /** From the first change until the fresh render lands; the old one is not current. */
  updating: boolean;
  error: string | null;
}

/**
 * The server's render of the email as it stands, compiled by the same pipeline the send
 * uses. A newer change aborts the request in flight, so a stale render never lands.
 */
export function useCampaignPreview(input: CampaignPreviewInput | null): CampaignPreviewState {
  const client = useApolloClient();
  const key = input ? JSON.stringify(input) : '';
  const [state, setState] = useState<CampaignPreviewState>({
    preview: null,
    updating: Boolean(input),
    error: null,
  });

  useEffect(() => {
    if (!key) {
      return undefined;
    }
    const controller = new AbortController();
    setState((previous) => ({ ...previous, updating: true, error: null }));
    const timer = globalThis.setTimeout(() => {
      client
        .query({
          query: previewCampaignContentQuery,
          variables: { input: JSON.parse(key) as CampaignPreviewInput },
          fetchPolicy: 'network-only',
          context: { fetchOptions: { signal: controller.signal } },
        })
        .then(({ data }) => {
          if (!controller.signal.aborted && data) {
            setState({ preview: data.previewCampaignContent, updating: false, error: null });
          }
        })
        .catch((err: unknown) => {
          if (!controller.signal.aborted) {
            setState((previous) => ({
              ...previous,
              updating: false,
              error: errorMessage(err, 'The preview could not be built.'),
            }));
          }
        });
    }, DEBOUNCE_MS);
    return () => {
      globalThis.clearTimeout(timer);
      controller.abort();
    };
  }, [client, key]);

  return state;
}
