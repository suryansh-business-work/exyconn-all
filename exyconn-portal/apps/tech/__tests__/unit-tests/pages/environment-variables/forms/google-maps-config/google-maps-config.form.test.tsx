import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  GoogleMapsConfigForm,
  type GoogleMapsConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/google-maps-config';
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
  useCreateGoogleMapsConfigMutation: () => [gql.create],
  useUpdateGoogleMapsConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const BROWSER_KEY = fakeSecret('AIza', 35);
const SERVER_KEY = fakeSecret('AIza', 35);
const BAD_KEY_MESSAGE = 'A Google API key starts with "AIza", e.g. AIzaSy…';
const BROWSER_LABEL = 'Maps JavaScript key (browser)';
const SERVER_LABEL = 'Places API key (server)';

const stored = (overrides: Partial<GoogleMapsConfigRow> = {}): GoogleMapsConfigRow => ({
  id: 'gm-1',
  label: 'Production',
  hasBrowserKey: true,
  browserKeyHint: 'b123',
  hasServerKey: true,
  serverKeyHint: 's456',
  isActive: true,
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...overrides,
});

const renderForm = (initial: GoogleMapsConfigRow | null = null) =>
  renderWithProviders(
    <GoogleMapsConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('GoogleMapsConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('asks for a label and the Places server key when creating', async () => {
    renderForm();
    expect(screen.getByText(/restrict it in Google Cloud to the CRM/)).toBeInTheDocument();
    expect(screen.getByText(/enable Places API \(New\)/)).toBeInTheDocument();
    await press('Create');
    await expectMessages('Label is required', 'Places server key is required');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects keys that are not Google API keys, and a short one', async () => {
    renderForm();
    fill('Label', 'L'.repeat(101));
    fill(BROWSER_LABEL, fakeSecret('XYZa', 35));
    fill(SERVER_LABEL, 'AIzaShort');
    await press('Create');
    await expectMessages('At most 100 characters');
    expect(screen.getAllByText(BAD_KEY_MESSAGE)).toHaveLength(2);
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a config with only the server key, maps staying off', async () => {
    renderForm();
    fill('Label', 'Search only');
    fill(SERVER_LABEL, SERVER_KEY);
    await pickOption(/^Set as active/, 'No');
    await press('Create');
    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: { label: 'Search only', browserKey: '', serverKey: SERVER_KEY, isActive: false },
      },
    });
    expect(await toast()).toHaveTextContent('Google Maps config created');
  });

  it('creates a config with both keys', async () => {
    renderForm();
    fill('Label', 'Production');
    fill(BROWSER_LABEL, BROWSER_KEY);
    fill(SERVER_LABEL, SERVER_KEY);
    await press('Create');
    await doneOnce(cb.onDone);
    expect(gql.create.mock.calls[0][0].variables.input).toEqual({
      label: 'Production',
      browserKey: BROWSER_KEY,
      serverKey: SERVER_KEY,
      isActive: true,
    });
  });

  it('keeps both stored keys when an edit leaves them blank', async () => {
    renderForm(stored());
    expect(
      screen.getAllByText('Saved. Use the eye to see it, or type a new one to replace it.'),
    ).toHaveLength(2);
    await press('Update');
    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'gm-1',
        input: { label: 'Production', browserKey: '', serverKey: '', isActive: true },
      },
    });
    expect(await toast()).toHaveTextContent('Google Maps config updated');
  });

  it('still checks a replacement key typed on an edit', async () => {
    renderForm(stored({ hasBrowserKey: false, hasServerKey: false, isActive: false }));
    expect(screen.getAllByText('Leave blank to keep the current value')).toHaveLength(2);
    expect(screen.getByRole('combobox', { name: /^Set as active/ })).toHaveTextContent('No');
    fill(SERVER_LABEL, 'wrong-key');
    await press('Update');
    await expectMessages(BAD_KEY_MESSAGE);
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('reports a failed save and stays open', async () => {
    gql.update.mockRejectedValue(new Error('Google rejected the key'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('Google rejected the key');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
