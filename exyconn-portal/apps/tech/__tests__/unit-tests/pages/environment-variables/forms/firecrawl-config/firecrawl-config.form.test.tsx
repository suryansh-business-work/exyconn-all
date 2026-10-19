import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  FirecrawlConfigForm,
  type FirecrawlConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/firecrawl-config';
import { renderWithProviders } from '../../../../test-utils';
import {
  doneOnce,
  expectMessages,
  fakeSecret,
  fill,
  formCallbacks,
  pickOption,
  press,
  toast,
} from '../form.helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateFirecrawlConfigMutation: () => [gql.create],
  useUpdateFirecrawlConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const KEY = fakeSecret('fc-', 32);
const HOSTED = 'https://api.firecrawl.dev';
const SELF_HOSTED = 'http://firecrawl.internal:3002';

const stored = (overrides: Partial<FirecrawlConfigRow> = {}): FirecrawlConfigRow => ({
  id: 'fc-1',
  label: 'Scraper',
  baseUrl: SELF_HOSTED,
  hasApiKey: false,
  apiKeyHint: null,
  isActive: true,
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...overrides,
});

const renderForm = (initial: FirecrawlConfigRow | null = null) =>
  renderWithProviders(
    <FirecrawlConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('FirecrawlConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('starts on the hosted API and needs a label and a key for it', async () => {
    renderForm();
    expect(screen.getByLabelText('Base URL')).toHaveValue(HOSTED);
    expect(screen.getByText(/Leave empty for a self-hosted Firecrawl/)).toBeInTheDocument();
    await press('Create');
    await expectMessages(
      'Label is required',
      'An API key is required for the hosted Firecrawl API',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a base URL that is not http(s) and one that is too long', async () => {
    renderForm();
    fill('Label', 'L'.repeat(101));
    fill('Base URL', 'ftp://firecrawl.internal');
    await press('Create');
    await expectMessages('At most 100 characters', 'Enter a URL starting with http:// or https://');
    fill('Base URL', `https://example.com/${'a'.repeat(300)}`);
    await press('Create');
    await expectMessages('At most 300 characters');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('asks for a base URL', async () => {
    renderForm();
    fill('Base URL', '');
    await press('Create');
    await expectMessages('Base URL is required');
  });

  it('creates a hosted config with its key', async () => {
    renderForm();
    fill('Label', 'Hosted');
    fill('API key', KEY);
    await press('Create');
    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: { input: { label: 'Hosted', baseUrl: HOSTED, apiKey: KEY, isActive: true } },
    });
    expect(await toast()).toHaveTextContent('Firecrawl config created');
  });

  it('creates a self-hosted config without a key', async () => {
    renderForm();
    fill('Label', 'Own install');
    fill('Base URL', SELF_HOSTED);
    await pickOption(/^Set as active/, 'No');
    await press('Create');
    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: { label: 'Own install', baseUrl: SELF_HOSTED, apiKey: '', isActive: false },
      },
    });
  });

  it('keeps the stored key when an edit of the hosted API leaves it blank', async () => {
    renderForm(stored({ baseUrl: HOSTED, hasApiKey: true, apiKeyHint: 'Ab12' }));
    expect(screen.getByLabelText('Base URL')).toHaveValue(HOSTED);
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'fc-1',
        input: { label: 'Scraper', baseUrl: HOSTED, apiKey: '', isActive: true },
      },
    });
    expect(await toast()).toHaveTextContent('Firecrawl config updated');
  });

  it('keeps an inactive config inactive', async () => {
    renderForm(stored({ isActive: false }));
    expect(screen.getByRole('combobox', { name: /^Set as active/ })).toHaveTextContent('No');
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update.mock.calls[0][0].variables.input.isActive).toBe(false);
  });

  it('reports a failed save and stays open', async () => {
    gql.update.mockRejectedValue(new Error('Firecrawl is unreachable'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('Firecrawl is unreachable');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
