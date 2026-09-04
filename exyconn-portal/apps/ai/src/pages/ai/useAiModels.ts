import { useAiModelsQuery } from '@exyconn/shell/graphql/generated';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';

/**
 * The models the active OpenAI key can reach, as picker options.
 *
 * They are read from OpenAI rather than listed in the app: the account's entitlements
 * change without us, and a hard-coded list would offer models that fail on first use.
 * `error` carries the reason the list is empty — usually "no active key yet".
 */
export function useAiModels(): {
  options: SelectOption[];
  defaultModel: string;
  loading: boolean;
  error?: string;
} {
  const { data, loading, error } = useAiModelsQuery();
  const options = (data?.aiModels.models ?? []).map((model) => ({ value: model, label: model }));
  return {
    options,
    defaultModel: data?.aiModels.defaultModel ?? '',
    loading,
    error: error?.message,
  };
}
