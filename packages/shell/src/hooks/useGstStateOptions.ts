import { useGstStatesQuery } from '@/graphql/generated';
import type { SelectOption } from '@/components/form/rhf/types';

/**
 * The GST state picker's options, read from the server's table so no form carries its
 * own copy. The blank first entry is what lets the field be cleared.
 */
export function useGstStateOptions(emptyLabel = 'Not set'): SelectOption[] {
  const { data } = useGstStatesQuery();
  const states = (data?.gstStates ?? []).map((state) => ({
    value: state.code,
    label: `${state.code} — ${state.name}`,
  }));
  return [{ value: '', label: emptyLabel }, ...states];
}
