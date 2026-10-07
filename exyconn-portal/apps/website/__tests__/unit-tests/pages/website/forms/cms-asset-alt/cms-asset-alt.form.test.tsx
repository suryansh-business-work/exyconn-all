import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { UseEntitySaveOptions } from '@exyconn/shell/components/form/useEntitySave';
import {
  AssetAltForm,
  type AssetAltFormValues,
  type AssetAltRow,
} from '../../../../../../src/pages/website/forms/cms-asset-alt';
import { renderWithProviders } from '../../../../test-utils';
import { fillField, press } from '../content-form-helpers';

const gql = vi.hoisted(() => ({
  updateAlt: vi.fn(),
  saveOptions: null as UseEntitySaveOptions<AssetAltFormValues, AssetAltRow> | null,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdateCmsAssetAltMutation: () => [gql.updateAlt],
}));

/** The real save hook, with the options the form hands it recorded. */
vi.mock('@exyconn/shell/components/form/useEntitySave', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@exyconn/shell/components/form/useEntitySave')>();
  return {
    useEntitySave: (options: UseEntitySaveOptions<AssetAltFormValues, AssetAltRow>) => {
      gql.saveOptions = options;
      return actual.useEntitySave(options);
    },
  };
});

const asset = (overrides: Partial<AssetAltRow> = {}): AssetAltRow => ({
  id: 'asset-1',
  name: 'hero.png',
  alt: 'Team at the office',
  ...overrides,
});

function renderForm(row: AssetAltRow | null) {
  const onClose = vi.fn();
  const view = renderWithProviders(<AssetAltForm asset={row} onClose={onClose} />);
  return { ...view, onClose };
}

describe('AssetAltForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.updateAlt.mockResolvedValue({ data: { updateCmsAssetAlt: { id: 'asset-1' } } });
  });

  it('stays closed without a file', () => {
    renderForm(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on the file’s current alt text', () => {
    renderForm(asset());

    expect(screen.getByRole('heading', { name: 'Alt text for hero.png' })).toBeInTheDocument();
    expect(screen.getByLabelText('Alt text')).toHaveValue('Team at the office');
  });

  it('saves the new alt text, trimmed, and closes', async () => {
    const { onClose } = renderForm(asset());

    await fillField('Alt text', '  Five people around a desk  ');
    await press('Update');

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(gql.updateAlt).toHaveBeenCalledWith({
      variables: { id: 'asset-1', alt: 'Five people around a desk' },
    });
    expect(await screen.findByText('Alt text updated')).toBeInTheDocument();
  });

  it('accepts an empty alt text for a decorative image', async () => {
    const { onClose } = renderForm(asset());

    await fillField('Alt text', ' ');
    await press('Update');

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(gql.updateAlt).toHaveBeenCalledWith({ variables: { id: 'asset-1', alt: '' } });
  });

  it('caps the alt text at 300 characters', async () => {
    renderForm(asset());

    fireEvent.change(screen.getByLabelText('Alt text'), { target: { value: 'a'.repeat(301) } });
    await press('Update');

    expect(await screen.findByText('Keep the alt text under 300 characters')).toBeInTheDocument();
    expect(gql.updateAlt).not.toHaveBeenCalled();
  });

  it('reloads the text when another file is opened', () => {
    const { rerender } = renderForm(asset());

    rerender(<AssetAltForm asset={asset({ id: 'asset-2', alt: '' })} onClose={vi.fn()} />);

    expect(screen.getByLabelText('Alt text')).toHaveValue('');
  });

  it('never creates a file: the create step resolves without a mutation', async () => {
    renderForm(asset());

    await expect(gql.saveOptions?.create({ alt: 'x' })).resolves.toBeUndefined();
    expect(gql.updateAlt).not.toHaveBeenCalled();
  });

  it('closes from its cancel button', async () => {
    const { onClose } = renderForm(asset());

    await press('Cancel');

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
