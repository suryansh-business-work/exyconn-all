import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useListCompaniesPagedQuery,
  useListContactsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ColdEmailRecordPicker } from '../../../../src/records/cold-email/ColdEmailRecordPicker';
import type {
  ColdEmailObject,
  ColdEmailRecordOption,
} from '../../../../src/records/cold-email/useColdEmailRecordOptions';
import { renderWithProviders } from '../../test-utils';
import { answered, companyRow, contactRow } from '../../fixtures';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListContactsPagedQuery: vi.fn(),
  useListCompaniesPagedQuery: vi.fn(),
}));

const contacts = vi.mocked(useListContactsPagedQuery);
const companies = vi.mocked(useListCompaniesPagedQuery);

const ASHA = contactRow({ id: 'c1', name: 'Asha Rao', title: 'CTO', companyName: 'Acme' });
const BO = contactRow({ id: 'c2', name: 'Bo Chen', title: '', companyName: '' });
const ACME = companyRow({ id: 'co1', name: 'Acme', domain: 'acme.io' });

function renderPicker(
  object: ColdEmailObject = 'CONTACT',
  value: ColdEmailRecordOption | null = null,
) {
  const onObjectChange = vi.fn();
  const onChange = vi.fn();
  renderWithProviders(
    <ColdEmailRecordPicker
      object={object}
      onObjectChange={onObjectChange}
      value={value}
      onChange={onChange}
    />,
  );
  return { onObjectChange, onChange };
}

describe('ColdEmailRecordPicker', () => {
  beforeEach(() => {
    contacts
      .mockReset()
      .mockReturnValue(
        answered({ listContactsPaged: { totalCount: 2, rows: [ASHA, BO] } }) as never,
      );
    companies
      .mockReset()
      .mockReturnValue(answered({ listCompaniesPaged: { totalCount: 1, rows: [ACME] } }) as never);
  });

  it('searches contacts by default, with a hint on what to type', () => {
    renderPicker();
    expect(screen.getByRole('button', { name: 'Contact', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Company', pressed: false })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Contact' })).toBeInTheDocument();
    expect(screen.getByText('Type a name to search your CRM')).toBeInTheDocument();
  });

  it('lists each match with its role and company, and hands the picked one back', async () => {
    const { onChange } = renderPicker();
    await userEvent.click(screen.getByRole('combobox', { name: 'Contact' }));
    const asha = await screen.findByRole('option', { name: /^Asha Rao\s*CTO, Acme$/ });
    expect(screen.getByRole('option', { name: 'Bo Chen' })).toBeInTheDocument();

    await userEvent.click(asha);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ object: 'CONTACT', id: 'c1', name: 'Asha Rao' }),
    );
  });

  it('searches the server for what was typed, keeping its order', async () => {
    renderPicker();
    await userEvent.type(screen.getByRole('combobox', { name: 'Contact' }), 'Bo');
    await waitFor(() =>
      expect(contacts).toHaveBeenLastCalledWith(
        expect.objectContaining({ variables: { input: { page: 0, pageSize: 20, search: 'Bo' } } }),
      ),
    );
    // The server already filtered: the picker does not narrow its answer again.
    expect(screen.getByRole('option', { name: /^Asha Rao\s*CTO, Acme$/ })).toBeInTheDocument();
  });

  it('switches to companies', async () => {
    const { onObjectChange } = renderPicker();
    await userEvent.click(screen.getByRole('button', { name: 'Company' }));
    expect(onObjectChange).toHaveBeenCalledWith('COMPANY');
  });

  it('keeps searching the current kind when its toggle is clicked again', async () => {
    const { onObjectChange } = renderPicker();
    await userEvent.click(screen.getByRole('button', { name: 'Contact' }));
    expect(onObjectChange).not.toHaveBeenCalled();
  });

  it('labels the search for a company and lists companies by domain', async () => {
    renderPicker('COMPANY');
    await userEvent.click(screen.getByRole('combobox', { name: 'Company' }));
    expect(await screen.findByRole('option', { name: /^Acme\s*acme\.io$/ })).toBeInTheDocument();
  });

  it('shows the picked record', () => {
    renderPicker('CONTACT', {
      object: 'CONTACT',
      id: 'c1',
      name: 'Asha Rao',
      emails: [],
      website: '',
      detail: '',
    });
    expect(screen.getByRole('combobox', { name: 'Contact' })).toHaveValue('Asha Rao');
  });

  it('says when nothing matches', async () => {
    contacts.mockReturnValue(answered({ listContactsPaged: { totalCount: 0, rows: [] } }) as never);
    renderPicker();
    await userEvent.click(screen.getByRole('combobox', { name: 'Contact' }));
    expect(await screen.findByText('No matches')).toBeInTheDocument();
  });

  it('says it is searching while the answer is on its way', async () => {
    contacts.mockReturnValue({ data: undefined, loading: true } as never);
    renderPicker();
    await userEvent.click(screen.getByRole('combobox', { name: 'Contact' }));
    expect(await screen.findByText('Searching…')).toBeInTheDocument();
  });

  it('says the records could not be loaded, and logs why', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('CRM offline');
    contacts.mockReturnValue({ data: undefined, loading: false, error: failure } as never);
    renderPicker();

    expect(screen.getByText('The records could not be loaded. Try again.')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Contact' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith('crm: searching records for a cold email failed', failure),
    );
    warn.mockRestore();
  });
});
