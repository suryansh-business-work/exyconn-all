import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  DATE_FORMATS,
  TIME_FORMATS,
  countryOptions,
  endonymOf,
  timezoneOptions,
  useI18n,
} from '@exyconn/i18n';
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
  return useMemo(() => [WORKSPACE_DEFAULT_OPTION, ...timezoneOptions(current)], [current]);
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

/** Each pattern labelled with "now" written through it, so the choice reads as a date. */
function patternOptions(patterns: readonly string[], includeDefault: boolean): SelectOption[] {
  const now = new Date();
  const options = patterns.map((value) => ({ value, label: `${format(now, value)}  (${value})` }));
  return includeDefault ? [WORKSPACE_DEFAULT_OPTION, ...options] : options;
}

/** The date patterns (date-fns, ISO 8601 first) a workspace or a person may pick. */
export function useDateFormatOptions(includeDefault = true): SelectOption[] {
  return useMemo(() => patternOptions(DATE_FORMATS, includeDefault), [includeDefault]);
}

/** The time patterns a workspace or a person may pick. */
export function useTimeFormatOptions(includeDefault = true): SelectOption[] {
  return useMemo(() => patternOptions(TIME_FORMATS, includeDefault), [includeDefault]);
}

/**
 * Every ISO 3166-1 country, named in the reader's language. The same table the server checks
 * against, so nothing picked here can be refused as "not a country".
 */
export function useCountryOptions(): SelectOption[] {
  const { locale } = useI18n();
  return useMemo(
    () => countryOptions(locale).map((option) => ({ value: option.code, label: option.label })),
    [locale],
  );
}

/** What a stored tag reads as, for a screen showing it rather than editing it. */
export function localeLabel(tag: string | null | undefined): string {
  return tag ? endonymOf(tag) : WORKSPACE_DEFAULT_OPTION.label;
}
