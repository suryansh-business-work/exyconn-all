import {
  useCampaignStudioOptionsQuery,
  type CampaignStudioOptionsQuery,
} from '@exyconn/shell/graphql/generated';

type Options = CampaignStudioOptionsQuery['campaignStudioOptions'];

export interface StudioOptions {
  verifiedSenders: string[];
  variables: Options['variables'];
  categories: Options['categories'];
  loading: boolean;
  error: string | null;
}

/** Verified senders, the variable registry and preference categories, from the server. */
export function useStudioOptions(): StudioOptions {
  const { data, loading, error } = useCampaignStudioOptionsQuery();
  const options = data?.campaignStudioOptions;
  return {
    verifiedSenders: options?.verifiedSenders ?? [],
    variables: options?.variables ?? [],
    categories: options?.categories ?? [],
    loading,
    error: error?.message ?? null,
  };
}
