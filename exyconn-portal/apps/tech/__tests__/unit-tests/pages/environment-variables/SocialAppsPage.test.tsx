import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { SOCIAL_APPS_PATH, SocialAppsPage } from '../../../../src/pages/environment-variables';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../../src/pages/environment-variables/SocialAppsPanel', async () =>
  (await import('./panel.harness')).panelModule('SocialAppsPanel'),
);

describe('SocialAppsPage', () => {
  it('has its own Tech sidebar address', () => {
    expect(SOCIAL_APPS_PATH).toBe('/tech/social-apps');
  });

  it('puts the social apps panel on the page', () => {
    renderWithProviders(<SocialAppsPage />);
    expect(screen.getByTestId('SocialAppsPanel')).toBeInTheDocument();
  });
});
