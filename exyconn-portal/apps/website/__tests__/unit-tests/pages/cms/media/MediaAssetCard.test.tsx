import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaAssetCard } from '../../../../../src/pages/cms/media/MediaAssetCard';
import { renderWithProviders } from '../../../test-utils';
import { mediaAsset } from './media.fixtures';

const actions = () => ({ onCopy: vi.fn(), onEditAlt: vi.fn(), onDelete: vi.fn() });

describe('MediaAssetCard', () => {
  it('shows an image with its alt text, name, size and pixel size', () => {
    renderWithProviders(<MediaAssetCard asset={mediaAsset()} />);

    expect(screen.getByRole('img', { name: 'Exyconn logo' })).toHaveAttribute(
      'src',
      'https://ik.imagekit.io/exyconn/logo.png',
    );
    expect(screen.getByText('logo.png')).toBeInTheDocument();
    expect(screen.getByText('1.5 KB · 640×480')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('names an image without alt text by its file name', () => {
    renderWithProviders(<MediaAssetCard asset={mediaAsset({ alt: '' })} />);
    expect(screen.getByRole('img', { name: 'logo.png' })).toBeInTheDocument();
  });

  it('shows a PDF as an icon, without a pixel size', () => {
    renderWithProviders(
      <MediaAssetCard
        asset={mediaAsset({ name: 'brochure.pdf', mime: 'application/pdf', width: 0, size: 512 })}
      />,
    );

    expect(screen.queryByRole('img', { name: /brochure/ })).not.toBeInTheDocument();
    expect(screen.getByText('512 B')).toBeInTheDocument();
  });

  it('copies, edits the alt text of and deletes the file in library mode', async () => {
    const asset = mediaAsset();
    const handlers = actions();
    renderWithProviders(<MediaAssetCard asset={asset} actions={handlers} />);

    await userEvent.click(screen.getByRole('button', { name: 'Copy URL' }));
    await userEvent.click(screen.getByRole('button', { name: 'Edit alt text' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete logo.png' }));

    expect(handlers.onCopy).toHaveBeenCalledWith(asset);
    expect(handlers.onEditAlt).toHaveBeenCalledWith(asset);
    expect(handlers.onDelete).toHaveBeenCalledWith(asset);
  });

  it('chooses the file with one click in picker mode', async () => {
    const asset = mediaAsset();
    const onPick = vi.fn();
    renderWithProviders(<MediaAssetCard asset={asset} onPick={onPick} actions={actions()} />);

    expect(screen.queryByRole('button', { name: 'Copy URL' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Use logo.png' }));

    expect(onPick).toHaveBeenCalledWith(asset);
  });
});
