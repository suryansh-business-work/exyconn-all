import type { SelectOption } from '@/components/form/rhf/types';

/** A leave type as a picker offers it: HR's own name, with the code a request stores. */
export function leaveTypeOptions(
  policies: readonly { code: string; name: string }[],
): SelectOption[] {
  return policies.map((policy) => ({
    value: policy.code,
    label: `${policy.name} (${policy.code})`,
  }));
}
