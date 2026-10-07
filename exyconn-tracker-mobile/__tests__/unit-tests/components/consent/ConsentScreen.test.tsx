import { screen } from '@testing-library/react';
import type { ConsentPolicy } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { ConsentScreen } from '../../../../src/components/consent/ConsentScreen';
import { PHONE_WEBCAM_DISCLOSURE } from '../../../../src/lib/capabilities/phone-records';
import { renderWithProviders } from '../../test-utils';
import { propsOf } from '../../app/stub';
import { settings } from '../../dashboard/fixtures';
import { ANDROID_CAPABILITIES, IOS_CAPABILITIES } from '../state';

vi.mock('../../../../src/forms/consent', async () => ({
  ConsentForm: (await import('../../app/stub')).stub('consent-form'),
}));
vi.mock('../../../../src/tracker/platform', async () => ({
  capabilities: (await import('../state')).ANDROID_CAPABILITIES,
}));

const NO_DISCLOSURE =
  'Your workspace has not published a monitoring disclosure yet. You cannot agree to something that has not been disclosed — ask your administrator to publish it in the portal.';

function policy(overrides: Partial<ConsentPolicy> = {}): ConsentPolicy {
  return {
    id: 'policy-1',
    title: 'Monitoring policy',
    slug: 'monitoring',
    summary: '',
    body: '<p>The policy text.</p>',
    version: 3,
    requiresAcknowledgement: false,
    acknowledged: false,
    ...overrides,
  };
}

function form() {
  return propsOf(screen.getByTestId('consent-form'));
}

describe('ConsentScreen', () => {
  it('shows the tracker’s own consent text when no policy has been chosen', () => {
    renderWithProviders(
      <ConsentScreen
        settings={settings({ consentText: '<p>We record time.</p>', webcamEnabled: false })}
        policy={null}
        capabilities={ANDROID_CAPABILITIES}
      />,
    );
    expect(screen.getByText('Before you start')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Read what this app records while tracking is on. Nothing is captured until you agree and tap Start.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('webview')).toHaveTextContent('We record time.');
    expect(form()).toEqual({ mustSign: false, canAgree: true });
  });

  it('refuses agreement to a disclosure that was never published', () => {
    renderWithProviders(
      <ConsentScreen
        settings={settings({ consentText: '' })}
        policy={null}
        capabilities={ANDROID_CAPABILITIES}
      />,
    );
    expect(screen.getByText(NO_DISCLOSURE)).toBeInTheDocument();
    expect(screen.queryByTestId('webview')).toBeNull();
    expect(form()).toEqual({ mustSign: false, canAgree: false });
  });

  it('treats a disclosure of only white space as unpublished', () => {
    renderWithProviders(
      <ConsentScreen
        settings={null}
        policy={policy({ body: '   ' })}
        capabilities={ANDROID_CAPABILITIES}
      />,
    );
    expect(screen.getByText(NO_DISCLOSURE)).toBeInTheDocument();
    expect(form()).toEqual({ mustSign: false, canAgree: false });
  });

  it('refuses agreement before the settings have loaded', () => {
    renderWithProviders(
      <ConsentScreen settings={null} policy={null} capabilities={IOS_CAPABILITIES} />,
    );
    expect(screen.getByText(NO_DISCLOSURE)).toBeInTheDocument();
  });

  it('asks for a signature against the version of a policy that requires one', () => {
    renderWithProviders(
      <ConsentScreen
        settings={settings({ consentText: '<p>Old text</p>' })}
        policy={policy({ requiresAcknowledgement: true })}
        capabilities={ANDROID_CAPABILITIES}
      />,
    );
    expect(screen.getByText('Monitoring policy')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Version 3 of your workspace's policy. Nothing is captured until you sign and tap Start.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('webview')).toHaveTextContent('The policy text.');
    expect(screen.getByTestId('webview')).not.toHaveTextContent('Old text');
    expect(form()).toEqual({ mustSign: true, canAgree: true });
  });

  it('asks only for agreement to a policy that needs no signature', () => {
    renderWithProviders(
      <ConsentScreen settings={null} policy={policy()} capabilities={ANDROID_CAPABILITIES} />,
    );
    expect(
      screen.getByText(
        "Version 3 of your workspace's policy. Nothing is captured until you agree and tap Start.",
      ),
    ).toBeInTheDocument();
    expect(form()).toEqual({ mustSign: false, canAgree: true });
  });

  it('states the webcam on its own account when the workspace takes photos', () => {
    renderWithProviders(
      <ConsentScreen
        settings={settings({ webcamEnabled: true })}
        policy={policy()}
        capabilities={ANDROID_CAPABILITIES}
      />,
    );
    expect(screen.getByText(PHONE_WEBCAM_DISCLOSURE)).toBeInTheDocument();
    expect(screen.getByTestId('icon-camera-outline')).toBeInTheDocument();
  });

  it('says nothing about a webcam this phone cannot use', () => {
    renderWithProviders(
      <ConsentScreen
        settings={settings({ webcamEnabled: true })}
        policy={policy()}
        capabilities={IOS_CAPABILITIES}
      />,
    );
    expect(screen.queryByText(PHONE_WEBCAM_DISCLOSURE)).toBeNull();
  });

  it('lists what this phone records beside the disclosure', () => {
    renderWithProviders(
      <ConsentScreen settings={settings()} policy={policy()} capabilities={ANDROID_CAPABILITIES} />,
    );
    expect(screen.getByText('What this phone records')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Nothing is recorded while tracking is off, and you can pause or stop at any time.',
      ),
    ).toBeInTheDocument();
  });
});
