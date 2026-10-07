import { screen } from '@testing-library/react';
import { buildSettingRows } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CapabilityCard } from '../../../../src/components/settings/CapabilityCard';
import { WorkspaceSettingsCard } from '../../../../src/components/settings/WorkspaceSettingsCard';
import { phoneRecords } from '../../../../src/lib/capabilities/phone-records';
import { renderWithProviders } from '../../test-utils';
import { t } from '../../translator';
import { settings } from '../../dashboard/fixtures';
import { ANDROID_CAPABILITIES, IOS_CAPABILITIES } from '../state';

const platform = vi.hoisted(() => ({
  capabilities: {
    screenshots: false,
    foregroundApp: false,
    inputCounts: false,
    webcam: false,
    background: false,
  },
}));

vi.mock('../../../../src/tracker/platform', () => platform);

beforeEach(() => {
  Object.assign(platform.capabilities, IOS_CAPABILITIES);
});

describe('CapabilityCard', () => {
  it('says what this phone records, next to what a computer would', () => {
    const workspace = settings();
    renderWithProviders(<CapabilityCard settings={workspace} />);

    expect(screen.getByText('What this phone records')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The same account records more on a computer. This is what the tracker can see here.',
      ),
    ).toBeInTheDocument();
    for (const line of phoneRecords(IOS_CAPABILITIES, workspace)) {
      expect(screen.getByText(line.title)).toBeInTheDocument();
    }
  });
});

describe('WorkspaceSettingsCard', () => {
  it('says the settings are unavailable before the portal has answered', () => {
    renderWithProviders(<WorkspaceSettingsCard settings={null} />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Settings are not available right now.')).toBeInTheDocument();
  });

  it('lists the administrator’s settings as they were set', () => {
    const workspace = settings();
    renderWithProviders(<WorkspaceSettingsCard settings={workspace} />);

    for (const row of buildSettingRows(t, workspace)) {
      expect(screen.getByText(row.label)).toBeInTheDocument();
    }
    expect(screen.queryByText('Settings are not available right now.')).not.toBeInTheDocument();
  });

  it('notes on an iPhone that screenshot settings do not apply here', () => {
    renderWithProviders(<WorkspaceSettingsCard settings={settings()} />);

    expect(
      screen.getByText('Not on this phone — iPhone does not let apps capture the screen.'),
    ).toBeInTheDocument();
  });

  it('drops the screenshot notes on a phone that captures the screen', () => {
    Object.assign(platform.capabilities, ANDROID_CAPABILITIES);
    renderWithProviders(<WorkspaceSettingsCard settings={settings()} />);

    expect(
      screen.queryByText('Not on this phone — iPhone does not let apps capture the screen.'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'A phone has no window titles — only the name of the app in front is recorded.',
      ),
    ).toBeInTheDocument();
  });
});
