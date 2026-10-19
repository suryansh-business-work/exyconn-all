import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useCreateColdEmailDraftMutation,
  useFirecrawlReadyQuery,
  useListCompaniesPagedQuery,
  useListContactsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { NewColdEmailButton } from '../../../../src/records/cold-email';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { answered, companyRow, contactRow } from '../../fixtures';
import { press } from '../../form-helpers';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListContactsPagedQuery: vi.fn(),
  useListCompaniesPagedQuery: vi.fn(),
  useCreateColdEmailDraftMutation: vi.fn(),
  useFirecrawlReadyQuery: vi.fn(),
}));

const create = vi.fn();
const ASHA = contactRow({ id: 'c1', name: 'Asha Rao', email: 'asha@acme.io' });
const ACME = companyRow({ id: 'co1', name: 'Acme', domain: 'acme.io', email: '', emails: [] });

function Url() {
  return <output aria-label="current url">{useCurrentUrl()}</output>;
}

function renderButton() {
  renderWithProviders(
    <>
      <NewColdEmailButton />
      <Url />
    </>,
    { route: '/cold-emails' },
  );
}

async function openAndPick(kind: 'Contact' | 'Company', name: string) {
  await press('Draft a cold email');
  if (kind === 'Company') {
    await userEvent.click(screen.getByRole('button', { name: 'Company' }));
  }
  await userEvent.click(screen.getByRole('combobox', { name: kind }));
  await userEvent.click(await screen.findByRole('option', { name: new RegExp(`^${name}`) }));
}

describe('NewColdEmailButton', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    vi.mocked(useListContactsPagedQuery).mockReturnValue(
      answered({ listContactsPaged: { totalCount: 1, rows: [ASHA] } }) as never,
    );
    vi.mocked(useListCompaniesPagedQuery).mockReturnValue(
      answered({ listCompaniesPaged: { totalCount: 1, rows: [ACME] } }) as never,
    );
    vi.mocked(useFirecrawlReadyQuery).mockReturnValue({ data: { firecrawlReady: false } } as never);
    create.mockReset().mockResolvedValue({ data: { createColdEmailDraft: { id: 'draft-9' } } });
    vi.mocked(useCreateColdEmailDraftMutation).mockReturnValue([
      create,
      { loading: false },
    ] as never);
  });

  it('opens a panel that asks who the email is for before showing the form', async () => {
    renderButton();
    expect(screen.queryByRole('heading', { name: 'Draft a cold email' })).toBeNull();

    await press('Draft a cold email');
    expect(screen.getByRole('heading', { name: 'Draft a cold email' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Contact' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Generate' })).toBeNull();
  });

  it('drafts for the picked contact and opens the new draft', async () => {
    renderButton();
    await openAndPick('Contact', 'Asha Rao');
    expect(screen.getByRole('combobox', { name: /^To( \*)?$/ })).toHaveTextContent('asha@acme.io');

    await press('Generate');
    await waitFor(() =>
      expect(screen.getByLabelText('current url')).toHaveTextContent('/cold-emails/draft-9'),
    );
    expect(create).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          object: 'CONTACT',
          recordId: 'c1',
          toEmail: 'asha@acme.io',
        }),
      },
    });
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Draft a cold email' })).toBeNull(),
    );
  });

  it('warns about a company with no address, and will not draft to it', async () => {
    renderButton();
    await openAndPick('Company', 'Acme');
    expect(
      screen.getByText('Acme has no email address yet. Add one to the record first.'),
    ).toBeInTheDocument();

    await press('Generate');
    expect(await screen.findByText('Choose who it goes to')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('forgets the picked record when switching to companies', async () => {
    renderButton();
    await openAndPick('Contact', 'Asha Rao');
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Company' }));
    expect(screen.getByRole('combobox', { name: 'Company' })).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Generate' })).toBeNull();
  });

  it('closes on cancel, and opens fresh next time', async () => {
    renderButton();
    await openAndPick('Contact', 'Asha Rao');
    await press('Cancel');
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Draft a cold email' })).toBeNull(),
    );
    expect(create).not.toHaveBeenCalled();
    expect(screen.getByLabelText('current url')).toHaveTextContent(/^\/cold-emails$/);

    await press('Draft a cold email');
    expect(screen.getByRole('combobox', { name: 'Contact' })).toHaveValue('');
  });

  it('closes from the panel close button', async () => {
    renderButton();
    await press('Draft a cold email');
    await press('Close');
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Draft a cold email' })).toBeNull(),
    );
  });

  it('stays open on the record when the AI cannot draft', async () => {
    create.mockRejectedValue(new Error('AI budget spent'));
    renderButton();
    await openAndPick('Contact', 'Asha Rao');
    await press('Generate');

    expect(await screen.findByText('AI budget spent')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Draft a cold email' })).toBeInTheDocument();
    expect(screen.getByLabelText('current url')).toHaveTextContent(/^\/cold-emails$/);
  });
});
