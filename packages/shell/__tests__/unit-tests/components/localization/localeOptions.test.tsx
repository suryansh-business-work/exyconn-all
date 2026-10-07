import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { I18nProvider } from '@exyconn/i18n';
import { LocaleOptionsDocument } from '@/graphql/generated';
import {
  LocalePreferenceFields,
  WORKSPACE_DEFAULT_OPTION,
  localeLabel,
  useCountryOptions,
  useLanguageOptions,
  useTimezoneOptions,
} from '@/components/localization';
import { renderWithProviders } from '../../test-utils';
import { FormHarness } from '../form/formHarness';

const localesMock: MockLink.MockedResponse = {
  request: { query: LocaleOptionsDocument },
  result: {
    data: {
      localeOptions: [
        { __typename: 'LocaleOption', tag: 'en', label: 'English', direction: 'ltr' },
        { __typename: 'LocaleOption', tag: 'hi', label: 'हिन्दी', direction: 'ltr' },
      ],
    },
  },
  maxUsageCount: 5,
};

const wrapper = (mocks: MockLink.MockedResponse[], locale = 'en') =>
  function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <MockedProvider mocks={mocks}>
        <I18nProvider locale={locale} messages={{}}>
          {children}
        </I18nProvider>
      </MockedProvider>
    );
  };

describe('locale option hooks', () => {
  it('lists every zone after the workspace default, keeping a stored zone', () => {
    const { result } = renderHook(() => useTimezoneOptions('Asia/Kolkata'));

    expect(result.current[0]).toBe(WORKSPACE_DEFAULT_OPTION);
    expect(result.current.some((option) => option.value === 'Asia/Kolkata')).toBe(true);
    expect(renderHook(() => useTimezoneOptions()).result.current[0]).toEqual({
      value: '',
      label: 'Use the workspace default',
    });
  });

  it('offers the languages from the server, with or without the default', async () => {
    const { result } = renderHook(() => useLanguageOptions(), { wrapper: wrapper([localesMock]) });
    expect(result.current).toEqual([WORKSPACE_DEFAULT_OPTION]);
    await waitFor(() => expect(result.current).toHaveLength(3));
    expect(result.current[2]).toEqual({ value: 'hi', label: 'हिन्दी' });

    const bare = renderHook(() => useLanguageOptions(false), { wrapper: wrapper([localesMock]) });
    await waitFor(() =>
      expect(bare.result.current).toEqual([
        { value: 'en', label: 'English' },
        { value: 'hi', label: 'हिन्दी' },
      ]),
    );
  });

  it('names every country in the reader language', () => {
    const { result } = renderHook(() => useCountryOptions(), { wrapper: wrapper([], 'de') });

    expect(result.current).toContainEqual({ value: 'DE', label: 'Deutschland' });
    expect(result.current.length).toBeGreaterThan(200);
  });

  it('reads a stored tag in its own language, or as the default when empty', () => {
    expect(localeLabel('fr')).toBe('français');
    expect(localeLabel(null)).toBe('Use the workspace default');
    expect(localeLabel(undefined)).toBe('Use the workspace default');
    expect(localeLabel('')).toBe('Use the workspace default');
  });
});

describe('LocalePreferenceFields', () => {
  it('offers the zones and the server languages under the default names', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ timezone: 'Asia/Kolkata', locale: '' }}>
        <LocalePreferenceFields />
      </FormHarness>,
      { mocks: [localesMock] },
    );

    expect((screen.getByRole('combobox', { name: 'Timezone' }) as HTMLInputElement).value).toMatch(
      /Kolkata/,
    );
    await userEvent.click(screen.getByRole('combobox', { name: /Language/ }));
    const listbox = await screen.findByRole('listbox');
    await waitFor(() =>
      expect(
        within(listbox)
          .getAllByRole('option')
          .map((o) => o.textContent),
      ).toEqual(['Use the workspace default', 'English', 'हिन्दी']),
    );
  });

  it('works under other field names, and with no zone stored yet', () => {
    renderWithProviders(
      <FormHarness defaultValues={{}}>
        <LocalePreferenceFields timezoneName="profile.zone" localeName="profile.lang" />
      </FormHarness>,
    );

    expect(document.querySelector('input[name="profile.zone"]')).toHaveValue('');
    expect(document.querySelector('input[name="profile.lang"]')).toHaveValue('');
  });
});
