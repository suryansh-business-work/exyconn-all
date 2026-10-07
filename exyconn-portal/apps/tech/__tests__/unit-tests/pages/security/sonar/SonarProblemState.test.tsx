import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SonarOverviewState } from '@exyconn/shell/graphql/generated';
import { SonarProblemState } from '../../../../../src/pages/security/sonar/SonarProblemState';
import { SONAR_SETTINGS_PATH } from '../../../../../src/pages/security/sonar/sonar.types';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const renderState = (state: SonarOverviewState, message = '') =>
  renderWithProviders(
    <>
      <SonarProblemState state={state} message={message} />
      <Url />
    </>,
    { route: '/tech/security/sonarqube' },
  );

describe('SonarProblemState', () => {
  it('invites setting SonarQube up when it is not configured', async () => {
    renderState(SonarOverviewState.NotConfigured);
    expect(screen.getByText('SonarQube is not set up')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Set up SonarQube' }));
    expect(screen.getByLabelText('url')).toHaveTextContent(SONAR_SETTINGS_PATH);
  });

  it.each([
    SonarOverviewState.Unauthorized,
    SonarOverviewState.Unreachable,
    SonarOverviewState.NotFound,
    SonarOverviewState.Error,
  ])('gives the reason SonarQube answered %s and a way to the settings', async (state) => {
    renderState(state, 'The token was rejected.');
    expect(screen.getByRole('alert')).toHaveTextContent('The token was rejected.');
    await userEvent.click(screen.getByRole('button', { name: 'Check settings' }));
    expect(screen.getByLabelText('url')).toHaveTextContent(SONAR_SETTINGS_PATH);
  });
});
