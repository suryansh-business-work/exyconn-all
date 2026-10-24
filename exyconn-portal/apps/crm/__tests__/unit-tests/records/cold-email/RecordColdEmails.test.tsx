import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColdEmailStatus } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { RecordColdEmails } from '../../../../src/records/cold-email';
import type { ColdEmailDraftTarget } from '../../../../src/records/cold-email/forms/cold-email-draft';
import { useCommsDock } from '../../../../src/records/comms/commsStore';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { resetDock } from '../comms/comms-fixtures';
import { draft, variant } from './cold-email-fixtures';

const gql = vi.hoisted(() => ({
  drafts: vi.fn(),
  draft: vi.fn(),
  deleteVariant: vi.fn(),
  updateVariant: vi.fn(),
  rewrite: vi.fn(),
  addVariant: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useColdEmailDraftsQuery: () => gql.drafts(),
  useColdEmailDraftQuery: (options: unknown) => gql.draft(options),
  useDeleteColdEmailVariantMutation: () => [gql.deleteVariant, { loading: false }],
  useUpdateColdEmailVariantMutation: () => [gql.updateVariant, { loading: false }],
  useRewriteColdEmailDraftMutation: () => [gql.rewrite],
  useAddColdEmailVariantMutation: () => [gql.addVariant, { loading: false }],
  useFirecrawlReadyQuery: () => ({ data: { firecrawlReady: false } }),
}));

const row = (id: string, toEmail: string, status = ColdEmailStatus.Draft) => ({
  __typename: 'ColdEmailDraft',
  id,
  object: 'COMPANY',
  recordId: 'co-1',
  recordName: 'Acme',
  toEmail,
  status,
  variantCount: 2,
  createdByName: 'Asha',
  updatedAt: '2026-10-19T10:00:00.000Z',
});

const listed = (rows: unknown[], totalCount = rows.length) => ({
  data: { coldEmailDrafts: { rows, totalCount } },
  loading: false,
  error: undefined,
});

/** Prints the router's address, so a test can see the open draft ride in the URL. */
function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const TARGET: ColdEmailDraftTarget = {
  object: 'COMPANY',
  id: 'co-1',
  name: 'Acme',
  emails: ['hello@acme.com'],
  website: 'acme.com',
};

/** A fresh element each call, so a rerender really renders again. */
const section = () => (
  <>
    <RecordColdEmails target={TARGET} />
    <Url />
  </>
);

const renderSection = (route = '/companies/co-1/cold-emails') =>
  renderWithProviders(section(), { route });

const url = () => screen.getByRole('status', { name: 'url' }).textContent;
const opened = () => screen.queryByRole('region', { name: 'Open cold email' });

describe('RecordColdEmails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    gql.drafts.mockReturnValue(
      listed([
        row('draft-1', 'hello@acme.com'),
        row('draft-2', 'sales@acme.com', ColdEmailStatus.Sent),
      ]),
    );
    gql.draft.mockReturnValue({
      data: { coldEmailDraft: draft([variant('v1'), variant('v2')]) },
      refetch: vi.fn(),
    });
  });
  afterEach(() => resetDock());

  it('holds the place while the drafts load', () => {
    gql.drafts.mockReturnValue({ data: undefined, loading: true, error: undefined });
    renderSection();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('says why the drafts could not load', () => {
    gql.drafts.mockReturnValue({ data: undefined, loading: false, error: new Error('Forbidden') });
    renderSection();
    expect(screen.getByRole('alert')).toHaveTextContent('Forbidden');
  });

  it('points at the draft button when the record has none', () => {
    gql.drafts.mockReturnValue(listed([]));
    renderSection();
    expect(
      screen.getByText('No cold emails yet. Use "Draft a cold email" to write one.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Draft a cold email' })).toBeInTheDocument();
    expect(screen.queryByText(/^Showing the latest/)).toBeNull();
  });

  it('says when the record has more drafts than the tab lists', () => {
    gql.drafts.mockReturnValue(listed([row('draft-1', 'hello@acme.com')], 51));
    renderSection();
    expect(screen.getByText('Showing the latest 1 of 51 cold emails.')).toBeInTheDocument();
  });

  it('lists the drafts, and opens one in place with its id in the address', async () => {
    renderSection();
    const [, first, second] = screen.getAllByRole('row');
    expect(first).toHaveTextContent('hello@acme.com');
    expect(second).toHaveTextContent('sales@acme.com');
    expect(second).toHaveTextContent('Sent');
    expect(opened()).toBeNull();

    await userEvent.click(first);

    expect(url()).toBe('/companies/co-1/cold-emails?coldEmail=draft-1');
    expect(gql.draft).toHaveBeenLastCalledWith({
      variables: { id: 'draft-1' },
      fetchPolicy: 'cache-and-network',
    });
    expect(within(opened()!).getByText('To hello@acme.com')).toBeInTheDocument();
    expect(within(opened()!).getByText('2 versions')).toBeInTheDocument();
    expect(within(opened()!).getByRole('heading', { name: 'Subject v1' })).toBeInTheDocument();
  });

  it('closes the open draft from its own button or by clicking its row again', async () => {
    renderSection('/companies/co-1/cold-emails?tab=x&coldEmail=draft-1');
    expect(opened()).not.toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Close the cold email' }));
    expect(opened()).toBeNull();
    expect(url()).toBe('/companies/co-1/cold-emails?tab=x');

    const [, first] = screen.getAllByRole('row');
    await userEvent.click(first);
    expect(opened()).not.toBeNull();
    await userEvent.click(first);
    expect(opened()).toBeNull();
  });

  it('shows one version at a time and switches between them', async () => {
    renderSection('/companies/co-1/cold-emails?coldEmail=draft-1');
    const versions = screen.getByRole('group', { name: 'Versions' });
    expect(within(versions).getByRole('button', { name: 'Version 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(within(versions).getByRole('button', { name: 'Version 2' }));
    expect(screen.getByRole('heading', { name: 'Subject v2' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Subject v1' })).toBeNull();

    // Clicking the shown version again does not leave nothing shown.
    await userEvent.click(within(versions).getByRole('button', { name: 'Version 2' }));
    expect(screen.getByRole('heading', { name: 'Subject v2' })).toBeInTheDocument();
  });

  it('opens the email dock with the shown version', async () => {
    renderSection('/companies/co-1/cold-emails?coldEmail=draft-1');
    await userEvent.click(screen.getByRole('button', { name: 'Use this' }));

    const { result } = renderHook(() => useCommsDock());
    expect(result.current.panels).toEqual([
      expect.objectContaining({
        channel: 'EMAIL',
        object: 'COMPANY',
        coldEmail: { draftId: 'draft-1', variantId: 'v1', subject: 'Subject v1', body: 'Body v1' },
      }),
    ]);
  });

  it('deletes the shown version once confirmed', async () => {
    gql.deleteVariant.mockResolvedValue({});
    renderSection('/companies/co-1/cold-emails?coldEmail=draft-1');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Delete' }));

    expect(gql.deleteVariant).toHaveBeenCalledWith({
      variables: { draftId: 'draft-1', variantId: 'v1' },
    });
  });

  it('edits the shown version in a dialog', async () => {
    renderSection('/companies/co-1/cold-emails?coldEmail=draft-1');
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

    const heading = await screen.findByRole('heading', { name: 'Edit version' });
    const drawer = within(heading.closest<HTMLElement>('.MuiDrawer-paper')!);
    expect(drawer.getByDisplayValue('Subject v1')).toBeInTheDocument();
    await userEvent.click(drawer.getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Edit version' })).toBeNull(),
    );
  });

  it('shows the first new version once the draft is rewritten', async () => {
    const before = draft([variant('v1'), variant('v2')]);
    gql.rewrite.mockResolvedValue({
      data: { rewriteColdEmailDraft: { ...before, variants: [...before.variants, variant('v3')] } },
    });
    gql.draft.mockReturnValue({ data: { coldEmailDraft: before }, refetch: vi.fn() });
    const view = renderSection('/companies/co-1/cold-emails?coldEmail=draft-1');

    await userEvent.click(screen.getByRole('button', { name: 'Rewrite based on latest data' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Rewrite' }));
    expect(
      await screen.findByText('New versions written from the latest data'),
    ).toBeInTheDocument();

    // The refetched draft now holds the third version, and it is the one shown.
    gql.draft.mockReturnValue({
      data: { coldEmailDraft: { ...before, variants: [...before.variants, variant('v3')] } },
      refetch: vi.fn(),
    });
    view.rerender(section());
    expect(await screen.findByRole('heading', { name: 'Subject v3' })).toBeInTheDocument();
  });

  it('holds the place while the opened draft loads', () => {
    gql.draft.mockReturnValue({ data: undefined, refetch: vi.fn() });
    renderSection('/companies/co-1/cold-emails?coldEmail=draft-1');
    expect(screen.getByLabelText('Loading the cold email')).toBeInTheDocument();
  });

  it('says why the opened draft could not load, with a retry', async () => {
    const refetch = vi.fn().mockRejectedValue(new Error('still down'));
    gql.draft.mockReturnValue({ data: undefined, error: new Error('Network down'), refetch });
    renderSection('/companies/co-1/cold-emails?coldEmail=draft-1');

    expect(within(opened()!).getByText('Network down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
    await vi.waitFor(() =>
      expect(portalLogger.warn).toHaveBeenCalledWith(
        'crm: reloading a cold email draft',
        expect.any(Error),
      ),
    );
  });

  it('shows nothing for a draft that holds no versions', () => {
    gql.draft.mockReturnValue({ data: { coldEmailDraft: draft([]) }, refetch: vi.fn() });
    renderSection('/companies/co-1/cold-emails?coldEmail=draft-1');
    expect(opened()).not.toBeNull();
    expect(screen.queryByRole('group', { name: 'Versions' })).toBeNull();
  });

  it('asks the AI for another version and shows it once written', async () => {
    const before = draft([variant('v1')]);
    gql.addVariant.mockResolvedValue({
      data: { addColdEmailVariant: { ...before, variants: [...before.variants, variant('v2')] } },
    });
    gql.draft.mockReturnValue({ data: { coldEmailDraft: before }, refetch: vi.fn() });
    const view = renderSection('/companies/co-1/cold-emails?coldEmail=draft-1');

    const another = screen.getByRole('region', { name: 'Generate another version' });
    await userEvent.type(within(another).getByLabelText(/^What should change/), 'shorter');
    await userEvent.click(
      within(another).getByRole('button', { name: 'Generate another version' }),
    );

    expect(gql.addVariant).toHaveBeenCalledWith({
      variables: { id: 'draft-1', instruction: 'shorter', tone: 'FRIENDLY' },
    });
    expect(await screen.findByText('New version written')).toBeInTheDocument();

    // The refetched draft holds the new version, and it is the one shown.
    gql.draft.mockReturnValue({
      data: { coldEmailDraft: { ...before, variants: [...before.variants, variant('v2')] } },
      refetch: vi.fn(),
    });
    view.rerender(section());
    expect(await screen.findByRole('heading', { name: 'Subject v2' })).toBeInTheDocument();
  });

  it('says why the AI could not write another version', async () => {
    gql.addVariant.mockRejectedValue(new Error('AI budget spent'));
    renderSection('/companies/co-1/cold-emails?coldEmail=draft-1');

    const another = screen.getByRole('region', { name: 'Generate another version' });
    await userEvent.click(
      within(another).getByRole('button', { name: 'Generate another version' }),
    );

    expect(await screen.findByText('AI budget spent')).toBeInTheDocument();
    expect(portalLogger.warn).toHaveBeenCalledWith(
      'crm: writing another cold email version failed',
      expect.any(Error),
    );
  });
});
