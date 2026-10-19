import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LeadImportStatus,
  SearchLeadPlacesDocument,
  type LeadSearchInput,
} from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { LeadWorkspace } from '../../../../src/pages/lead-generator/LeadWorkspace';
import type { LeadPlace } from '../../../../src/pages/lead-generator/leadTypes';
import { renderWithProviders } from '../../test-utils';
import { press } from '../../form-helpers';
import { foundLookup, importResult, leadPlace, preview } from './lead-fixtures';

const gql = vi.hoisted(() => ({
  findEmails: vi.fn(),
  previewLeads: vi.fn(),
  importLeads: vi.fn(),
}));
/** When set, the hook's action rejects, as an unexpected failure would. */
const broken = vi.hoisted(() => ({
  emailsRun: null as null | (() => Promise<void>),
  importRun: null as null | (() => Promise<void>),
  importConfirm: null as null | (() => Promise<void>),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useFindLeadEmailsMutation: () => [gql.findEmails],
  usePreviewLeadImportLazyQuery: () => [gql.previewLeads, { loading: false }],
  useImportLeadsToCrmMutation: () => [gql.importLeads, { loading: false }],
}));

vi.mock('../../../../src/pages/lead-generator/useLeadEmails', async (importOriginal) => {
  const real =
    await importOriginal<typeof import('../../../../src/pages/lead-generator/useLeadEmails')>();
  return {
    ...real,
    useLeadEmails: () => {
      const emails = real.useLeadEmails();
      return { ...emails, run: broken.emailsRun ?? emails.run };
    },
  };
});

vi.mock('../../../../src/pages/lead-generator/useLeadImport', async (importOriginal) => {
  const real =
    await importOriginal<typeof import('../../../../src/pages/lead-generator/useLeadImport')>();
  return {
    useLeadImport: (onFiled: Parameters<typeof real.useLeadImport>[0]) => {
      const importer = real.useLeadImport(onFiled);
      return {
        ...importer,
        run: broken.importRun ?? importer.run,
        confirm: broken.importConfirm ?? importer.confirm,
      };
    },
  };
});

vi.mock('../../../../src/pages/lead-generator/forms/lead-search', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../../../src/pages/lead-generator/forms/lead-search')
  >()),
  LeadSearchForm: (await import('./lead-workspace-stubs')).LeadSearchFormStub,
}));

vi.mock('../../../../src/pages/lead-generator/LeadMap', async () => ({
  LeadMap: (await import('./lead-workspace-stubs')).LeadMapStub,
}));

const a = leadPlace({ placeId: 'a', name: 'Alpha Dental', phone: '' });
const b = leadPlace({ placeId: 'b', name: 'Beta Dental', website: 'https://beta.example' });

function found(input: LeadSearchInput, places: LeadPlace[]) {
  return {
    request: { query: SearchLeadPlacesDocument, variables: { input } },
    result: {
      data: { searchLeadPlaces: { __typename: 'LeadSearchPage', nextPageToken: null, places } },
    },
  };
}

const PLACE_SEARCH: LeadSearchInput = { query: 'dentists', location: 'Pune' };

function renderWorkspace(mocks = [found(PLACE_SEARCH, [a, b])], browserKey: string | null = 'key') {
  renderWithProviders(<LeadWorkspace browserKey={browserKey} />, { mocks });
}

async function searchByPlace() {
  await press('Search place');
  await screen.findByText('1. Alpha Dental');
}

describe('LeadWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    broken.emailsRun = null;
    broken.importRun = null;
    broken.importConfirm = null;
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('tells the form whether the map can be used, and enables drawing only in area mode', async () => {
    renderWorkspace();

    expect(screen.getByText('hint: The map is loading…')).toBeInTheDocument();
    expect(screen.getByText('searching: false, map ready: false')).toBeInTheDocument();
    expect(screen.getByText('key: key, drawing: false')).toBeInTheDocument();

    await press('Map loaded');
    expect(screen.getByText('searching: false, map ready: true')).toBeInTheDocument();

    await press('Mode area');
    expect(screen.getByText('key: key, drawing: true')).toBeInTheDocument();
  });

  it('explains that map search needs a key when Tech has none', () => {
    renderWorkspace([], null);

    expect(
      screen.getByText('hint: Searching on the map needs a Maps JavaScript key in Tech.'),
    ).toBeInTheDocument();
    expect(screen.getByText('key: none, drawing: false')).toBeInTheDocument();
  });

  it('lists the places found, on the list and the map, and focuses a row from its marker', async () => {
    renderWorkspace();
    expect(screen.queryByRole('button', { name: 'Has phone' })).not.toBeInTheDocument();

    await searchByPlace();

    expect(screen.getByText('markers: a,b')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 2')).toBeInTheDocument();
    await press('Marker b');
    expect(screen.getByText('focused marker: b')).toBeInTheDocument();
  });

  it('searches around the map centre, or inside the drawn area', async () => {
    renderWorkspace([
      found({ query: 'dentists', lat: 18.5, lng: 73.8, radiusMeters: 2500 }, [a]),
      found(
        {
          query: 'dentists',
          polygon: [
            { lat: 1, lng: 2 },
            { lat: 3, lng: 4 },
            { lat: 5, lng: 6 },
          ],
        },
        [b],
      ),
    ]);

    await press('Pan map');
    await press('Search map');
    expect(await screen.findByText('markers: a')).toBeInTheDocument();

    await press('Search area');
    expect(await screen.findByText('markers: b')).toBeInTheDocument();
  });

  it('filters the list and the map together, and clears the focus and selection on a new search', async () => {
    renderWorkspace([found(PLACE_SEARCH, [a, b]), found(PLACE_SEARCH, [a, b])]);
    await searchByPlace();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Alpha Dental' }));
    await press('Marker a');

    await press('Has phone');
    expect(screen.getByText('markers: b')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 2')).toBeInTheDocument();
    await press('Has phone');

    await press('Search place');
    await screen.findByText('1. Alpha Dental');
    expect(screen.getByText('focused marker: none')).toBeInTheDocument();
    expect(screen.getByText('0 of 2 selected')).toBeInTheDocument();
  });

  it('reads the chosen websites for emails', async () => {
    gql.findEmails.mockResolvedValue({
      data: { findLeadEmails: foundLookup(['hi@beta.example']) },
    });
    renderWorkspace();
    await searchByPlace();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Beta Dental' }));
    await press('Find emails');

    expect(await screen.findByText('hi@beta.example')).toBeInTheDocument();
    expect(gql.findEmails).toHaveBeenCalledWith({ variables: { website: 'https://beta.example' } });
  });

  it('files new places straight away, shows the summary and links their rows', async () => {
    gql.previewLeads.mockResolvedValue({
      data: { previewLeadImport: [preview({ placeId: 'a' })] },
    });
    gql.importLeads.mockResolvedValue({
      data: {
        importLeadsToCrm: importResult({ created: 1, filed: [{ placeId: 'a', companyId: 'c-a' }] }),
      },
    });
    renderWorkspace();
    await searchByPlace();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Alpha Dental' }));
    await press('Add 1 to CRM');

    expect(await screen.findByText(/1 companies added to the CRM/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'In CRM' })).toHaveAttribute('href', '/companies/c-a');

    await press('Close');
    expect(screen.queryByText(/1 companies added to the CRM/)).not.toBeInTheDocument();
  });

  it('reviews duplicates before filing, and can be cancelled', async () => {
    gql.previewLeads.mockResolvedValue({
      data: {
        previewLeadImport: [
          preview({ placeId: 'a' }),
          preview({ placeId: 'b', status: LeadImportStatus.Duplicate, existingCompanyId: 'c-b' }),
        ],
      },
    });
    gql.importLeads.mockResolvedValue({ data: { importLeadsToCrm: importResult({ created: 1 }) } });
    renderWorkspace();
    await searchByPlace();
    await userEvent.click(screen.getByRole('checkbox', { name: '0 of 2 selected' }));
    await press('Add 2 to CRM');

    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await press('Add 2 to CRM');
    await userEvent.click(await screen.findByRole('button', { name: 'Add new only' }));

    expect(await screen.findByText(/1 companies added to the CRM/)).toBeInTheDocument();
    expect(gql.importLeads.mock.calls[0][0].variables.mergeInto).toEqual([]);
  });

  it('shows why adding to the CRM failed', async () => {
    gql.previewLeads.mockRejectedValue(new Error('CRM is read-only'));
    renderWorkspace();
    await searchByPlace();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Alpha Dental' }));

    await press('Add 1 to CRM');

    expect(await screen.findByText('CRM is read-only')).toBeInTheDocument();
  });

  it('logs an unexpected failure of finding emails or adding leads', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const boom = new Error('boom');
    broken.emailsRun = () => Promise.reject(boom);
    broken.importRun = () => Promise.reject(boom);
    renderWorkspace();
    await searchByPlace();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Alpha Dental' }));

    await press('Find emails');
    await press('Add 1 to CRM');
    await waitFor(() => expect(warn).toHaveBeenCalledWith('crm: adding leads', boom));
    expect(warn).toHaveBeenCalledWith('crm: finding lead emails', boom);
    warn.mockRestore();
  });

  it('logs an unexpected failure of the reviewed import', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const boom = new Error('boom');
    broken.importConfirm = () => Promise.reject(boom);
    gql.previewLeads.mockResolvedValue({
      data: {
        previewLeadImport: [
          preview({ placeId: 'a' }),
          preview({ placeId: 'b', status: LeadImportStatus.Duplicate }),
        ],
      },
    });
    renderWorkspace();
    await searchByPlace();
    await userEvent.click(screen.getByRole('checkbox', { name: '0 of 2 selected' }));
    await press('Add 2 to CRM');

    await userEvent.click(await screen.findByRole('button', { name: 'Add new only' }));

    await waitFor(() => expect(warn).toHaveBeenCalledWith('crm: adding reviewed leads', boom));
    warn.mockRestore();
  });
});
