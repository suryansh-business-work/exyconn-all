import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useAnalyzeWebScrapeMutation,
  useWebScrapeAiEstimateLazyQuery,
  type WebScrapeAiEstimateQuery,
} from '@exyconn/shell/graphql/generated';

export type AiEstimate = WebScrapeAiEstimateQuery['webScrapeAiEstimate'];

/** An instruction priced and waiting for the person to say Proceed or Cancel. */
export interface PendingAnalysis {
  instruction: string;
  estimate: AiEstimate;
}

/**
 * "Send to AI" in two steps: price the instruction first (nothing is spent), and only after
 * the person confirms that price send the page. The answer lands on the cached WebScrape.
 */
export function useAiAnalysis(scrapeId: string) {
  const t = useT();
  const [fetchEstimate, { loading: estimating }] = useWebScrapeAiEstimateLazyQuery({
    fetchPolicy: 'network-only',
  });
  const [analyze, { loading: analyzing }] = useAnalyzeWebScrapeMutation();
  const [pending, setPending] = useState<PendingAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestEstimate = async (instruction: string) => {
    setError(null);
    try {
      const { data, error: failure } = await fetchEstimate({
        variables: { id: scrapeId, instruction },
      });
      if (failure ?? !data) {
        throw failure ?? new Error('No estimate came back');
      }
      setPending({ instruction, estimate: data.webScrapeAiEstimate });
    } catch (error_) {
      portalLogger.warn('crm: estimating the AI cost of a scraped page failed', error_);
      setError(errorMessage(error_, t('Could not estimate the AI cost.')));
    }
  };

  const proceed = async () => {
    if (!pending) {
      return;
    }
    const { instruction } = pending;
    setPending(null);
    try {
      await analyze({ variables: { id: scrapeId, instruction } });
    } catch (error_) {
      portalLogger.warn('crm: sending a scraped page to the AI failed', error_);
      setError(errorMessage(error_, t('The AI could not read the page.')));
    }
  };

  return {
    pending,
    error,
    busy: estimating || analyzing,
    analyzing,
    requestEstimate,
    proceed,
    cancel: () => setPending(null),
  };
}
