import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { formatBytes } from '@exyconn/shell/utils/file';
import { DownloadButtons } from '../../../../src/pages/download/DownloadButtons';
import { renderWithProviders } from '../../test-utils';
import { releaseAsset } from './download.fixtures';

describe('DownloadButtons', () => {
  it('says the release has no installer for the platform instead of drawing no buttons', () => {
    renderWithProviders(<DownloadButtons assets={[]} platformLabel="Android" />);

    expect(
      screen.getByText(
        'This release has no Android installer. Ask Tech to run a build that includes it.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('lists the APK first as the filled download and the AAB after it, outlined', () => {
    const aab = releaseAsset('Exyconn-Tracker-1.9.9.aab', 'android');
    const apk = releaseAsset('Exyconn-Tracker-1.9.9.apk', 'android');
    renderWithProviders(<DownloadButtons assets={[aab, apk]} platformLabel="Android" />);

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Download APK', 'Download AAB']);
    expect(links[0]).toHaveAttribute('href', apk.url);
    expect(links[1]).toHaveAttribute('href', aab.url);
    expect(links[0].className).toContain('MuiButton-contained');
    expect(links[1].className).toContain('MuiButton-outlined');
    expect(screen.getByText('Installs straight on an Android phone.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Android App Bundle for the Google Play Console — a phone cannot install it.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the file name, its size and how often it was downloaded under each button', () => {
    const asset = releaseAsset('Exyconn-Tracker-1.9.9.apk', 'android');
    renderWithProviders(<DownloadButtons assets={[asset]} platformLabel="Android" />);

    expect(
      screen.getByText(`${asset.name} · ${formatBytes(asset.sizeBytes)} · 12 downloads`),
    ).toBeInTheDocument();
  });

  it('offers a desktop installer as one plain download with no caption line', () => {
    const exe = releaseAsset('Exyconn Tracker-Setup-1.9.9.exe', 'windows');
    const { container } = renderWithProviders(
      <DownloadButtons assets={[exe]} platformLabel="Windows" />,
    );

    expect(screen.getByRole('link', { name: 'Download for Windows' })).toHaveAttribute(
      'href',
      exe.url,
    );
    // Only the details line is a caption: an empty kind caption is not rendered.
    expect(container.querySelectorAll('.MuiTypography-caption')).toHaveLength(1);
  });
});
