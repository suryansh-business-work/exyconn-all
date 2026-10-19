import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useListCompaniesPagedQuery,
  useListContactsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import {
  useColdEmailRecordOptions,
  type ColdEmailObject,
} from '../../../../src/records/cold-email/useColdEmailRecordOptions';
import { answered, companyRow, contactRow, pending } from '../../fixtures';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListContactsPagedQuery: vi.fn(),
  useListCompaniesPagedQuery: vi.fn(),
}));

const contacts = vi.mocked(useListContactsPagedQuery);
const companies = vi.mocked(useListCompaniesPagedQuery);

const ASHA = contactRow({
  id: 'c1',
  name: 'Asha Rao',
  title: 'CTO',
  companyName: 'Acme',
  email: 'asha@acme.io',
  emails: [
    { __typename: 'CrmEmailAddress', address: 'asha@acme.io', label: 'Work', primary: true },
    { __typename: 'CrmEmailAddress', address: 'asha.rao@gmail.com', label: '', primary: false },
  ],
  website: 'asha.dev',
});
const BO = contactRow({
  id: 'c2',
  name: 'Bo Chen',
  title: '',
  companyName: '',
  email: '',
  emails: [],
});
const ACME = companyRow({
  id: 'co1',
  name: 'Acme',
  domain: 'acme.io',
  website: 'https://acme.io',
  email: 'hello@acme.io',
});
const GLOBEX = companyRow({ id: 'co2', name: 'Globex', domain: 'globex.com', website: '' });

function answer() {
  contacts.mockReturnValue(
    answered({ listContactsPaged: { totalCount: 2, rows: [ASHA, BO] } }) as never,
  );
  companies.mockReturnValue(
    answered({ listCompaniesPaged: { totalCount: 2, rows: [ACME, GLOBEX] } }) as never,
  );
}

const renderOptions = (object: ColdEmailObject, typed = '') =>
  renderHook((props) => useColdEmailRecordOptions(props.object, props.typed), {
    initialProps: { object, typed },
  });

describe('useColdEmailRecordOptions', () => {
  beforeEach(() => {
    contacts.mockReset();
    companies.mockReset();
    answer();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('searches contacts only while contacts are picked, twenty at a time', () => {
    renderOptions('CONTACT');
    const variables = { input: { page: 0, pageSize: 20, search: '' } };
    expect(contacts).toHaveBeenLastCalledWith({ variables, skip: false });
    expect(companies).toHaveBeenLastCalledWith({ variables, skip: true });
  });

  it('offers each contact with every address, main one first, and its role and company', () => {
    const { result } = renderOptions('CONTACT');
    expect(result.current.options).toEqual([
      {
        object: 'CONTACT',
        id: 'c1',
        name: 'Asha Rao',
        emails: ['asha@acme.io', 'asha.rao@gmail.com'],
        website: 'asha.dev',
        detail: 'CTO, Acme',
      },
      { object: 'CONTACT', id: 'c2', name: 'Bo Chen', emails: [], website: '', detail: '' },
    ]);
  });

  it('offers each company by its domain, using the domain when it has no website', () => {
    const { result } = renderOptions('COMPANY');
    expect(companies).toHaveBeenLastCalledWith(expect.objectContaining({ skip: false }));
    expect(contacts).toHaveBeenLastCalledWith(expect.objectContaining({ skip: true }));
    expect(result.current.options).toEqual([
      {
        object: 'COMPANY',
        id: 'co1',
        name: 'Acme',
        emails: ['hello@acme.io'],
        website: 'https://acme.io',
        detail: 'acme.io',
      },
      {
        object: 'COMPANY',
        id: 'co2',
        name: 'Globex',
        emails: [],
        website: 'globex.com',
        detail: 'globex.com',
      },
    ]);
  });

  it('searches once typing pauses, trimmed', () => {
    vi.useFakeTimers();
    const { rerender } = renderOptions('CONTACT');
    rerender({ object: 'CONTACT', typed: '  As' });
    rerender({ object: 'CONTACT', typed: '  Asha ' });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(contacts).toHaveBeenLastCalledWith(
      expect.objectContaining({ variables: { input: { page: 0, pageSize: 20, search: '' } } }),
    );
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(contacts).toHaveBeenLastCalledWith(
      expect.objectContaining({ variables: { input: { page: 0, pageSize: 20, search: 'Asha' } } }),
    );
  });

  it('offers nothing before the first answer, and says it is loading', () => {
    contacts.mockReturnValue(pending() as never);
    const { result } = renderOptions('CONTACT');
    expect(result.current).toEqual({ options: [], loading: true, error: undefined });
  });

  it('reports the error of the kind of record being searched only', () => {
    const failure = new Error('CRM offline');
    companies.mockReturnValue({ data: undefined, loading: false, error: failure } as never);
    expect(renderOptions('CONTACT').result.current.error).toBeUndefined();
    const { result } = renderOptions('COMPANY');
    expect(result.current).toEqual({ options: [], loading: false, error: failure });
  });
});
