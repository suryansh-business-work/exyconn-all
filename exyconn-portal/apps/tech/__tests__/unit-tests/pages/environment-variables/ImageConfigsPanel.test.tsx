import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageConfigsPanel } from '../../../../src/pages/environment-variables/ImageConfigsPanel';
import { renderWithProviders } from '../../test-utils';
import { describeConfigPanel } from './config-panel.suite';
import { forms, resetHarness } from './panel.harness';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListImageConfigsQuery: gql.list,
  useDeleteImageConfigMutation: () => [gql.remove],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/image-config', async () =>
  (await import('./panel.harness')).formModule('ImageConfigForm'),
);
vi.mock('../../../../src/pages/environment-variables/TestUploadDialog', async () =>
  (await import('./panel.harness')).dialogModule('TestUploadDialog'),
);

const ROWS = [
  {
    id: 'ik-1',
    label: 'Media',
    provider: 'imagekit',
    publicKey: 'public_abc',
    hasPrivateKey: true,
    privateKeyHint: 'pk12',
    urlEndpoint: 'https://ik.example.test/media',
    isActive: true,
  },
  {
    id: 'ik-2',
    label: 'Avatars',
    provider: 'imagekit-eu',
    publicKey: 'public_def',
    hasPrivateKey: false,
    privateKeyHint: null,
    urlEndpoint: 'https://ik.example.test/avatars',
    isActive: false,
  },
];

describeConfigPanel({
  name: 'ImageConfigsPanel',
  Panel: ImageConfigsPanel,
  listQuery: gql.list,
  listKey: 'listImageConfigs',
  rows: ROWS,
  cells: {
    'ik-1': ['Media', 'imagekit', 'https://ik.example.test/media', 'ACTIVE'],
    'ik-2': ['Avatars', 'imagekit-eu', 'https://ik.example.test/avatars', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Image config',
  confirm: 'Delete image config "{label}"?',
  title: 'Image upload configurations',
  actionLabel: 'New image config',
  emptyMessage: 'No image configs yet.',
  form: 'ImageConfigForm',
  newTitle: 'New image config',
  editTitle: 'Edit image config',
  backLabel: 'Back to Image upload configurations',
});

describe('ImageConfigsPanel test upload', () => {
  beforeEach(() => {
    resetHarness();
    gql.list.mockReturnValue({ data: { listImageConfigs: ROWS }, loading: false });
  });

  it('opens the upload test on the chosen provider and closes it again', async () => {
    renderWithProviders(<ImageConfigsPanel />);
    expect(screen.queryByTestId('TestUploadDialog')).not.toBeInTheDocument();
    const row = within(screen.getByTestId('row-ik-1'));
    await userEvent.click(row.getByRole('button', { name: 'test file upload' }));
    expect(forms.TestUploadDialog).toMatchObject({
      open: true,
      configId: 'ik-1',
      configLabel: 'Media',
    });
    await userEvent.click(screen.getByRole('button', { name: 'stub close' }));
    expect(screen.queryByTestId('TestUploadDialog')).not.toBeInTheDocument();
  });
});
