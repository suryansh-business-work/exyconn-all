import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaPickerDialog } from '../../../../../src/pages/cms/media/MediaPickerDialog';
import { MediaPage } from '../../../../../src/pages/cms/media';
import { renderWithProviders } from '../../../test-utils';
import { renderInSite } from '../cms-helpers';

vi.mock('../../../../../src/pages/cms/media/MediaLibrary', () => ({
  MediaLibrary: (props: Readonly<{ siteId: string; onPick?: (url: string) => void }>) => (
    <div>
      <p>{`Library of ${props.siteId}`}</p>
      {props.onPick && (
        <button type="button" onClick={() => props.onPick?.('https://cdn/picked.png')}>
          Pick file
        </button>
      )}
    </div>
  ),
}));

const renderPicker = (open: boolean, title?: string) => {
  const handlers = { onClose: vi.fn(), onPick: vi.fn() };
  renderWithProviders(
    <MediaPickerDialog open={open} siteId="site-1" title={title} {...handlers} />,
  );
  return handlers;
};

describe('MediaPickerDialog', () => {
  it("offers the site's library under the default title", () => {
    renderPicker(true);

    expect(screen.getByRole('dialog', { name: 'Choose from media' })).toBeInTheDocument();
    expect(screen.getByText('Library of site-1')).toBeInTheDocument();
  });

  it('takes the field label as its title', () => {
    renderPicker(true, 'Cover image');
    expect(screen.getByRole('dialog', { name: 'Cover image' })).toBeInTheDocument();
  });

  it('hands over the chosen file and closes', async () => {
    const handlers = renderPicker(true);
    await userEvent.click(screen.getByRole('button', { name: 'Pick file' }));

    expect(handlers.onPick).toHaveBeenCalledWith('https://cdn/picked.png');
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on cancel without choosing', async () => {
    const handlers = renderPicker(true);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(handlers.onClose).toHaveBeenCalledTimes(1);
    expect(handlers.onPick).not.toHaveBeenCalled();
  });

  it('renders nothing while closed', () => {
    renderPicker(false);
    expect(screen.queryByText('Library of site-1')).not.toBeInTheDocument();
  });
});

describe('MediaPage', () => {
  it("shows the current site's library under its heading", () => {
    renderInSite(<MediaPage />);

    expect(screen.getByRole('heading', { name: 'Media' })).toBeInTheDocument();
    expect(screen.getByText('Images and PDFs for Exyconn')).toBeInTheDocument();
    expect(screen.getByText('Library of site-1')).toBeInTheDocument();
  });
});
