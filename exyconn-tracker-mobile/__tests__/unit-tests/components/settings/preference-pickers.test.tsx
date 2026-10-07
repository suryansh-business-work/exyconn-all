import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProgressStylePicker } from '../../../../src/components/settings/ProgressStylePicker';
import { ThemeModePicker } from '../../../../src/components/settings/ThemeModePicker';
import { renderWithProviders } from '../../test-utils';

const trackerMock = vi.hoisted(() => ({ setPreferences: vi.fn() }));

vi.mock('../../../../src/tracker/instance', () => ({ tracker: trackerMock }));

describe('ThemeModePicker', () => {
  it('follows the phone by default, and says so', () => {
    renderWithProviders(<ThemeModePicker mode="system" />);

    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'false');
    expect(
      screen.getByText('Following your phone’s setting, and switching with it.'),
    ).toBeInTheDocument();
  });

  it('says a fixed choice ignores the phone', () => {
    renderWithProviders(<ThemeModePicker mode="light" />);

    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Fixed to your choice, whatever the phone does.')).toBeInTheDocument();
  });

  it('saves the picked appearance as this phone’s preference', () => {
    renderWithProviders(<ThemeModePicker mode="system" />);

    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(trackerMock.setPreferences).toHaveBeenCalledWith({ themeMode: 'dark' });
  });

  it('names the options in the employee’s language', () => {
    renderWithProviders(<ThemeModePicker mode="dark" />, { messages: { Dark: 'Dunkel' } });

    expect(screen.getByRole('radio', { name: 'Dunkel' })).toHaveAttribute('aria-checked', 'true');
  });
});

describe('ProgressStylePicker', () => {
  it('describes the bar when the bar is picked', () => {
    renderWithProviders(<ProgressStylePicker progressStyle="bar" />);

    expect(screen.getByRole('radio', { name: 'Bar' })).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByText('Today’s progress is drawn as a bar, with what is left as a length.'),
    ).toBeInTheDocument();
  });

  it('describes the ring when the ring is picked', () => {
    renderWithProviders(<ProgressStylePicker progressStyle="ring" />);

    expect(screen.getByRole('radio', { name: 'Ring' })).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByText('Today’s progress is drawn as a ring, with the percentage inside it.'),
    ).toBeInTheDocument();
  });

  it('saves the picked style as this phone’s preference', () => {
    renderWithProviders(<ProgressStylePicker progressStyle="bar" />);

    fireEvent.click(screen.getByRole('radio', { name: 'Ring' }));

    expect(trackerMock.setPreferences).toHaveBeenCalledWith({ progressStyle: 'ring' });
  });
});
