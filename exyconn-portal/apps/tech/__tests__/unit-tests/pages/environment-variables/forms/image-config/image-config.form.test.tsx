import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  ImageConfigForm,
  type ImageConfigRow,
} from '../../../../../../src/pages/environment-variables/forms/image-config';
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
  useCreateImageConfigMutation: () => [gql.create],
  useUpdateImageConfigMutation: () => [gql.update],
}));

const cb = formCallbacks();
const PRIVATE_KEY = fakeSecret('private_', 20);
const ENDPOINT = 'https://ik.imagekit.io/exyconn';
const PROVIDER = /^Provider/;
const ACTIVE = /^Set as active/;

const stored = (overrides: Partial<ImageConfigRow> = {}): ImageConfigRow => ({
  id: 'img-1',
  label: 'Media',
  provider: 'imagekit',
  publicKey: 'public_abc',
  hasPrivateKey: true,
  privateKeyHint: 'zz99',
  urlEndpoint: ENDPOINT,
  isActive: false,
  ...overrides,
});

const renderForm = (initial: ImageConfigRow | null = null) =>
  renderWithProviders(
    <ImageConfigForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('ImageConfigForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('offers ImageKit as the provider and starts a new config active', async () => {
    renderForm();
    expect(screen.getByRole('combobox', { name: PROVIDER })).toHaveTextContent('ImageKit');
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('Yes');
    await pickOption(PROVIDER, 'ImageKit');
    expect(screen.getByText('Stored write-only — it is never shown again')).toBeInTheDocument();
  });

  it('asks for the keys and the endpoint', async () => {
    renderForm();
    await press('Create');
    await expectMessages(
      'Label is required',
      'Public key is required',
      'Private key is required',
      'URL endpoint is required',
    );
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('wants a real URL for the endpoint', async () => {
    renderForm();
    fill('Label', 'Media');
    fill('Public key', 'public_abc');
    fill('Private key', PRIVATE_KEY);
    fill('URL endpoint', 'ik.imagekit.io/exyconn');
    await press('Create');
    await expectMessages('Enter a valid URL');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates an active ImageKit config', async () => {
    renderForm();
    fill('Label', 'Media');
    fill('Public key', 'public_abc');
    fill('Private key', PRIVATE_KEY);
    fill('URL endpoint', ENDPOINT);
    await press('Create');

    await doneOnce(cb.onDone);
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          label: 'Media',
          provider: 'imagekit',
          publicKey: 'public_abc',
          privateKey: PRIVATE_KEY,
          urlEndpoint: ENDPOINT,
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Image config created');
  });

  it('edits an inactive config, keeping its private key when blank', async () => {
    renderForm(stored());
    expect(screen.getByText('Leave blank to keep the current value')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('No');
    await pickOption(ACTIVE, 'Yes');
    await press('Update');

    await doneOnce(cb.onDone);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'img-1',
        input: {
          label: 'Media',
          provider: 'imagekit',
          publicKey: 'public_abc',
          privateKey: '',
          urlEndpoint: ENDPOINT,
          isActive: true,
        },
      },
    });
    expect(await toast()).toHaveTextContent('Image config updated');
  });

  it('reads an active config back as active', async () => {
    renderForm(stored({ isActive: true }));
    expect(screen.getByRole('combobox', { name: ACTIVE })).toHaveTextContent('Yes');
  });

  it('reports a failed save', async () => {
    gql.update.mockRejectedValue(new Error('ImageKit rejected the keys'));
    renderForm(stored());
    await press('Update');
    expect(await toast()).toHaveTextContent('ImageKit rejected the keys');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
