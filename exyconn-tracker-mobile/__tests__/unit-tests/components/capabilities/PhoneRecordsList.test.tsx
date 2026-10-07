import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PhoneRecordsList } from '../../../../src/components/capabilities/PhoneRecordsList';
import { NOTHING_WHEN_STOPPED, phoneRecords } from '../../../../src/lib/capabilities/phone-records';
import { renderWithProviders } from '../../test-utils';
import { settings } from '../../dashboard/fixtures';
import { ANDROID_CAPABILITIES, IOS_CAPABILITIES, getByA11yLabel } from '../state';

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
  Object.assign(platform.capabilities, ANDROID_CAPABILITIES);
});

describe('PhoneRecordsList', () => {
  it('lists every line this Android phone records, and what it never does', () => {
    const workspace = settings({ blurScreenshots: true });
    renderWithProviders(<PhoneRecordsList settings={workspace} />);
    for (const line of phoneRecords(ANDROID_CAPABILITIES, workspace)) {
      expect(screen.getByText(line.title)).toBeInTheDocument();
      expect(screen.getByText(line.detail)).toBeInTheDocument();
    }
    expect(screen.getByText(NOTHING_WHEN_STOPPED)).toBeInTheDocument();
  });

  it('reads each line as one sentence that says whether it is recorded', () => {
    const workspace = settings();
    renderWithProviders(<PhoneRecordsList settings={workspace} />);
    const [time, input] = phoneRecords(ANDROID_CAPABILITIES, workspace);
    expect(getByA11yLabel(`${time.title}: Recorded. ${time.detail}`)).toBeInTheDocument();
    expect(getByA11yLabel(`${input.title}: Not recorded. ${input.detail}`)).toBeInTheDocument();
  });

  it('marks recorded lines with a tick and the rest with a cross', () => {
    renderWithProviders(<PhoneRecordsList settings={settings()} />);
    // Time, apps, screenshots and the webcam are on; key presses never are.
    expect(screen.getAllByTestId('icon-check-circle-outline')).toHaveLength(4);
    expect(screen.getAllByTestId('icon-close-circle-outline')).toHaveLength(1);
  });

  it('on an iPhone records time alone, whatever the workspace asked for', () => {
    Object.assign(platform.capabilities, IOS_CAPABILITIES);
    renderWithProviders(<PhoneRecordsList settings={settings()} />);
    expect(screen.getAllByTestId('icon-check-circle-outline')).toHaveLength(1);
    expect(screen.getAllByTestId('icon-close-circle-outline')).toHaveLength(4);
    for (const line of phoneRecords(IOS_CAPABILITIES, settings())) {
      expect(screen.getByText(line.title)).toBeInTheDocument();
    }
  });

  it('still answers every question before the workspace settings have loaded', () => {
    renderWithProviders(<PhoneRecordsList settings={null} />);
    for (const line of phoneRecords(ANDROID_CAPABILITIES, null)) {
      expect(screen.getByText(line.title)).toBeInTheDocument();
    }
  });
});
