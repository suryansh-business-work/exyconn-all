import type { TypedDocumentNode } from '@apollo/client';
import { useEffect, useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  PreviewAudienceCountsDocument,
  type AudienceCountsFieldsFragment,
  type AudienceListInput,
  type PreviewAudienceCountsQuery,
  type PreviewAudienceCountsQueryVariables,
} from '@exyconn/shell/graphql/generated';

const previewAudienceCountsQuery: TypedDocumentNode<
  PreviewAudienceCountsQuery,
  PreviewAudienceCountsQueryVariables
> = PreviewAudienceCountsDocument;

/** Long enough that typing a value is one request, short enough to feel live. */
const DEBOUNCE_MS = 400;

export interface AudiencePreviewState {
  counts: AudienceCountsFieldsFragment | null;
  resolvedAt: string | null;
  /** True from the first change until fresh counts arrive; the old ones are not current. */
  updating: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * The server's counts for the audience as it stands in the form.
 *
 * Every change waits {@link DEBOUNCE_MS}, then asks; a newer change aborts the request still
 * in flight, so an answer for settings the form no longer has can never land on screen.
 */
export function useAudiencePreview(input: AudienceListInput): AudiencePreviewState {
  const client = useApolloClient();
  const key = JSON.stringify(input);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Omit<AudiencePreviewState, 'retry'>>({
    counts: null,
    resolvedAt: null,
    updating: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, updating: true, error: null }));
    const timer = globalThis.setTimeout(() => {
      client
        .query({
          query: previewAudienceCountsQuery,
          variables: { input: JSON.parse(key) as AudienceListInput },
          fetchPolicy: 'network-only',
          context: { fetchOptions: { signal: controller.signal } },
        })
        .then(({ data }) => {
          if (controller.signal.aborted || !data) {
            return;
          }
          setState({
            counts: data.previewAudience.counts,
            resolvedAt: data.previewAudience.resolvedAt,
            updating: false,
            error: null,
          });
        })
        .catch((err: unknown) => {
          if (!controller.signal.aborted) {
            setState((previous) => ({
              ...previous,
              updating: false,
              error: errorMessage(err, 'The counts could not be updated.'),
            }));
          }
        });
    }, DEBOUNCE_MS);
    return () => {
      globalThis.clearTimeout(timer);
      controller.abort();
    };
  }, [client, key, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
