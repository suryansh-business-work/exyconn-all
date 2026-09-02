import type { SelectOption } from '@/components/form/rhf/types';

/** Builds title-cased select options from a list of enum string values. */
export function enumOptions(values: readonly string[]): SelectOption[] {
  return values.map((value) => ({
    value,
    label: value
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
  }));
}
