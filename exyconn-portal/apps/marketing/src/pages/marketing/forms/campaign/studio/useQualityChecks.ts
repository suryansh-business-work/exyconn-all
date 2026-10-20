import { useState } from 'react';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useCampaignQualityChecksQuery } from '@exyconn/shell/graphql/generated';

/** The server's checks for the saved draft and its audience; re-run on demand. */
export function useQualityChecks(campaignId: string | null, audienceListId: string) {
  const [runError, setRunError] = useState<string | null>(null);
  const { data, loading, error, refetch } = useCampaignQualityChecksQuery({
    variables: { id: campaignId ?? '', audienceListId: audienceListId || null },
    skip: !campaignId,
    fetchPolicy: 'network-only',
  });
  return {
    report: data?.campaignQualityChecks ?? null,
    loading,
    error: runError ?? error?.message ?? null,
    run: () => {
      setRunError(null);
      refetch().catch((err: unknown) => setRunError(errorMessage(err, 'The checks could not run')));
    },
  };
}
