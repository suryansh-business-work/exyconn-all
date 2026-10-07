import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { formatWith } from '@exyconn/shell/utils/date';
import { StatusState } from '@exyconn/shell/graphql/generated';
import { OverallBanner } from '../../../../src/pages/status/OverallBanner';
import { StateChip } from '../../../../src/pages/status/StateChip';
import { TIME_FORMAT } from '../../../../src/status.constants';
import { renderWithProviders } from '../../test-utils';
import { overview } from './status.fixtures';

describe('OverallBanner', () => {
  it.each([
    [StatusState.Operational, 'All systems operational'],
    [StatusState.Degraded, 'Degraded performance'],
    [StatusState.Down, 'Service disruption'],
    [StatusState.Unknown, 'Waiting for the first check'],
  ])('headlines %s as "%s"', (state, headline) => {
    renderWithProviders(<OverallBanner overview={overview({ state })} />);
    expect(screen.getByText(headline)).toBeInTheDocument();
  });

  it('counts operational services and says how fresh the reading is', () => {
    const value = overview({ operational: 7, total: 9, checkIntervalMinutes: 2 });
    renderWithProviders(<OverallBanner overview={value} />);
    expect(
      screen.getByText(
        `7 of 9 services operational · Checked every 2 min · last updated ${formatWith(value.generatedAt, TIME_FORMAT)}`,
      ),
    ).toBeInTheDocument();
  });
});

describe('StateChip', () => {
  it.each([
    [StatusState.Operational, 'Operational'],
    [StatusState.Degraded, 'Degraded'],
    [StatusState.Down, 'Down'],
    [StatusState.Unknown, 'Not checked yet'],
  ])('labels %s as "%s"', (state, label) => {
    renderWithProviders(<StateChip state={state} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('is small unless asked otherwise', () => {
    const { container, rerender } = renderWithProviders(<StateChip state={StatusState.Down} />);
    expect(container.querySelector('.MuiChip-sizeSmall')).not.toBeNull();
    rerender(<StateChip state={StatusState.Down} size="medium" />);
    expect(container.querySelector('.MuiChip-sizeMedium')).not.toBeNull();
  });
});
