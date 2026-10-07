import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThisPhoneCard } from '../../../../src/components/settings/ThisPhoneCard';
import type { MobilePreferences } from '../../../../src/tracker/types';
import { renderWithProviders } from '../../test-utils';
import { settings } from '../../dashboard/fixtures';

// Each preference has its own tests; here they only show what the card handed them.
vi.mock('../../../../src/components/settings/CaptureSoundPreference', () => ({
  CaptureSoundPreference: ({
    muted,
    settings: workspace,
  }: Readonly<{ muted: boolean; settings: unknown }>) => (
    <span>{`sound muted: ${muted}, workspace: ${workspace === null ? 'none' : 'loaded'}`}</span>
  ),
}));
vi.mock('../../../../src/components/settings/ThemeModePicker', () => ({
  ThemeModePicker: ({ mode }: Readonly<{ mode: string }>) => <span>{`theme: ${mode}`}</span>,
}));
vi.mock('../../../../src/components/settings/TransparencyPreference', () => ({
  TransparencyPreference: ({
    transparent,
    opacity,
  }: Readonly<{ transparent: boolean; opacity: number }>) => (
    <span>{`transparent: ${transparent} at ${opacity}`}</span>
  ),
}));
vi.mock('../../../../src/components/settings/ProgressStylePicker', () => ({
  ProgressStylePicker: ({ progressStyle }: Readonly<{ progressStyle: string }>) => (
    <span>{`progress: ${progressStyle}`}</span>
  ),
}));
vi.mock('../../../../src/components/settings/UpdateSection', () => ({
  UpdateSection: () => <span>updates</span>,
}));

const PREFERENCES: MobilePreferences = {
  themeMode: 'dark',
  muteCaptureSound: true,
  progressStyle: 'ring',
  transparentBackground: true,
  backgroundOpacity: 0.6,
};

describe('ThisPhoneCard', () => {
  it('gathers the employee’s own choices for this phone', () => {
    renderWithProviders(<ThisPhoneCard preferences={PREFERENCES} settings={settings()} />);

    expect(screen.getByText('This app')).toBeInTheDocument();
    expect(screen.getByText('How the tracker behaves on this phone.')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Today’s progress')).toBeInTheDocument();
    expect(screen.getByText('updates')).toBeInTheDocument();
  });

  it('hands each control the preference it edits', () => {
    renderWithProviders(<ThisPhoneCard preferences={PREFERENCES} settings={settings()} />);

    expect(screen.getByText('sound muted: true, workspace: loaded')).toBeInTheDocument();
    expect(screen.getByText('theme: dark')).toBeInTheDocument();
    expect(screen.getByText('transparent: true at 0.6')).toBeInTheDocument();
    expect(screen.getByText('progress: ring')).toBeInTheDocument();
  });

  it('passes on that the workspace has not answered yet', () => {
    renderWithProviders(<ThisPhoneCard preferences={PREFERENCES} settings={null} />);

    expect(screen.getByText('sound muted: true, workspace: none')).toBeInTheDocument();
  });
});
