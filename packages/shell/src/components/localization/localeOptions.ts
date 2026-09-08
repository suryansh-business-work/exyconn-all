import { useMemo } from 'react';
import { endonymOf, timezoneOptions } from '@exyconn/i18n';
import type { SelectOption } from '@/components/form/rhf';
import { useLocaleOptionsQuery } from '@/graphql/generated';

/** The empty value every locale/timezone field offers: follow the workspace default. */
export const WORKSPACE_DEFAULT_OPTION: SelectOption = {
  value: '',
  label: 'Use the workspace default',
};

/**
 * Every IANA zone the browser knows, labelled with its current offset.
 *
 * Memoised on the current value only: the list is ~450 entries and rebuilding it on every
 * keystroke in the autocomplete is what makes a picker feel slow.
 */
export function useTimezoneOptions(current = ''): SelectOption[] {
  return useMemo(
    () => [WORKSPACE_DEFAULT_OPTION, ...timezoneOptions(current)],
    [current],
  );
}

/**
 * The languages this workspace offers, each named in its own language.
 *
 * From the server rather than a hardcoded list: which languages a workspace offers is an
 * admin's decision, and adding one must not need a deploy.
 */
export function useLanguageOptions(includeDefault = true): SelectOption[] {
  const { data } = useLocaleOptionsQuery({ fetchPolicy: 'cache-first' });
  return useMemo(() => {
    const options = (data?.localeOptions ?? []).map((option) => ({
      value: option.tag,
      label: option.label,
    }));
    return includeDefault ? [WORKSPACE_DEFAULT_OPTION, ...options] : options;
  }, [data, includeDefault]);
}

/** What a stored tag reads as, for a screen showing it rather than editing it. */
export function localeLabel(tag: string | null | undefined): string {
  return tag ? endonymOf(tag) : WORKSPACE_DEFAULT_OPTION.label;
}
