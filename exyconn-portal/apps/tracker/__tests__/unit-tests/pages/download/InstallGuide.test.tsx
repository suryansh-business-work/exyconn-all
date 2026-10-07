import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { InstallGuide } from '../../../../src/pages/download/InstallGuide';
import { renderWithProviders } from '../../test-utils';
import { platformOf } from './download.fixtures';

describe('InstallGuide', () => {
  it('numbers every install step of the platform in order', () => {
    const linux = platformOf('linux');
    renderWithProviders(<InstallGuide platform={linux} />);

    expect(screen.getByText('Installing on Linux')).toBeInTheDocument();
    linux.steps.forEach((step, index) => {
      const text = screen.getByText(step);
      const row = text.parentElement as HTMLElement;
      expect(within(row).getByText(String(index + 1))).toBeInTheDocument();
    });
  });

  it('warns about the platform caution above the steps', () => {
    const windows = platformOf('windows');
    renderWithProviders(<InstallGuide platform={windows} />);

    expect(screen.getByRole('alert')).toHaveTextContent(windows.caution);
  });

  it('draws no warning when the platform has nothing to warn about', () => {
    const quiet = { ...platformOf('windows'), caution: '' };
    renderWithProviders(<InstallGuide platform={quiet} />);

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('lists the permissions the app will ask for', () => {
    const macos = platformOf('macos');
    renderWithProviders(<InstallGuide platform={macos} />);

    expect(screen.getByText('Permissions it will ask for')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(items).toEqual(macos.permissions);
  });
});
