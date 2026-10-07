import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { DownloadHero } from '../../../../src/pages/download/DownloadHero';
import { renderWithProviders } from '../../test-utils';
import { platformOf, releaseAsset } from './download.fixtures';

const RELEASE_URL = 'https://github.example.test/releases/tracker-v1.9.9';

function renderHero(detected: boolean) {
  const macos = platformOf('macos');
  const dmg = releaseAsset('Exyconn Tracker-1.9.9-universal.dmg', 'macos');
  return renderWithProviders(
    <DownloadHero
      platform={macos}
      assets={[dmg]}
      version="1.9.9"
      releasedOn="03 Oct 2026"
      releaseUrl={RELEASE_URL}
      detected={detected}
      picker={<div data-testid="platform-picker" />}
    />,
  );
}

describe('DownloadHero', () => {
  it('names the platform, the version and the release date of the build', () => {
    renderHero(true);

    expect(screen.getByRole('heading', { name: 'Exyconn Tracker for macOS' })).toBeInTheDocument();
    expect(screen.getByText('Version 1.9.9')).toBeInTheDocument();
    expect(screen.getByText('Released 03 Oct 2026')).toBeInTheDocument();
    expect(screen.getByTestId('AppleIcon')).toBeInTheDocument();
  });

  it('tells a visitor on that platform the build is theirs', () => {
    renderHero(true);

    expect(
      screen.getByText('We detected macOS, so this is the build for you.'),
    ).toBeInTheDocument();
  });

  it('tells a visitor who picked another platform how to switch back', () => {
    renderHero(false);

    expect(
      screen.getByText('Showing the macOS build — switch platform on the right.'),
    ).toBeInTheDocument();
  });

  it('draws the download, the release notes link in a new tab, and the picker it was given', () => {
    renderHero(true);

    expect(screen.getByRole('link', { name: 'Download for macOS' })).toBeInTheDocument();
    const notes = screen.getByRole('link', { name: /Release notes on GitHub/ });
    expect(notes).toHaveAttribute('href', RELEASE_URL);
    expect(notes).toHaveAttribute('target', '_blank');
    expect(notes).toHaveAttribute('rel', 'noopener');
    expect(screen.getByTestId('platform-picker')).toBeInTheDocument();
  });
});
