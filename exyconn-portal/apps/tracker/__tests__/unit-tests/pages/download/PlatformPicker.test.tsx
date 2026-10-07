import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlatformPicker } from '../../../../src/pages/download/PlatformPicker';
import { PLATFORMS, type PlatformKey } from '../../../../src/pages/download/download.config';
import { renderWithProviders } from '../../test-utils';
import { platformOf } from './download.fixtures';

function renderPicker(onSelect = vi.fn<(key: PlatformKey) => void>()) {
  renderWithProviders(
    <PlatformPicker
      selected="linux"
      detected="macos"
      available={new Set(['windows', 'linux'])}
      onSelect={onSelect}
    />,
  );
  return onSelect;
}

const tile = (label: string) => screen.getByRole('button', { name: new RegExp(`^${label}`) });

describe('PlatformPicker', () => {
  it('draws one tile per configured platform under the heading', () => {
    renderPicker();

    expect(screen.getByText('All platforms')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(PLATFORMS.length);
  });

  it('marks only the selected platform as pressed', () => {
    renderPicker();

    expect(tile('Linux')).toHaveAttribute('aria-pressed', 'true');
    expect(tile('Windows')).toHaveAttribute('aria-pressed', 'false');
    expect(tile('macOS')).toHaveAttribute('aria-pressed', 'false');
  });

  it('ticks the platform the visitor is browsing from, and no other', () => {
    renderPicker();

    expect(within(tile('macOS')).getByTestId('CheckCircleIcon')).toBeInTheDocument();
    expect(within(tile('Linux')).queryByTestId('CheckCircleIcon')).toBeNull();
    expect(screen.getAllByTestId('CheckCircleIcon')).toHaveLength(1);
  });

  it('describes the installer of a shipped platform and flags one the release lacks', () => {
    renderPicker();

    expect(within(tile('Windows')).getByText(platformOf('windows').fileLabel)).toBeInTheDocument();
    expect(within(tile('macOS')).getByText('Not in this release')).toBeInTheDocument();
    expect(within(tile('Android')).getByText('Not in this release')).toBeInTheDocument();
  });

  it('hands the chosen platform key back when a tile is clicked', async () => {
    const onSelect = renderPicker();

    await userEvent.click(tile('Android'));
    await userEvent.click(tile('iOS'));

    expect(onSelect.mock.calls).toEqual([['android'], ['ios']]);
  });
});
