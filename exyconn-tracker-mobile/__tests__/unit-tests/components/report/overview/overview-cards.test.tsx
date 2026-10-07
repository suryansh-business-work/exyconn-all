import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChangeBadge } from '../../../../../src/components/report/overview/ChangeBadge';
import { MetricCard } from '../../../../../src/components/report/overview/MetricCard';
import { WorkedCard } from '../../../../../src/components/report/overview/WorkedCard';
import { renderWithProviders } from '../../../test-utils';
import { getByA11yLabel } from '../../state';
import { HOUR, periodTotals } from '../fixtures';

describe('ChangeBadge', () => {
  it.each([
    { direction: 'up', text: '+12%' },
    { direction: 'down', text: '-8%' },
    { direction: 'flat', text: '0%' },
  ] as const)('shows a $direction change as "$text"', ({ direction, text }) => {
    renderWithProviders(<ChangeBadge change={{ direction, text }} />);

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('reads the same in the dark theme', () => {
    renderWithProviders(<ChangeBadge change={{ direction: 'up', text: '+3%' }} />, {
      themeMode: 'dark',
    });

    expect(screen.getByText('+3%')).toBeInTheDocument();
  });
});

describe('MetricCard', () => {
  it('shows the figure with its name, icon, change and the period before', () => {
    renderWithProviders(
      <MetricCard
        label="Keystrokes"
        value="4,200"
        change={{ direction: 'up', text: '+100%' }}
        caption="2,100 the 7 days before"
        icon="keyboard-outline"
      />,
    );

    expect(screen.getByText('Keystrokes')).toBeInTheDocument();
    expect(screen.getByText('4,200')).toBeInTheDocument();
    expect(screen.getByText('+100%')).toBeInTheDocument();
    expect(screen.getByText('2,100 the 7 days before')).toBeInTheDocument();
    expect(screen.getByTestId('icon-keyboard-outline')).toBeInTheDocument();
  });

  it('shows no change when the period before had nothing to compare', () => {
    renderWithProviders(
      <MetricCard
        label="Mouse clicks"
        value="900"
        change={null}
        caption="0 the 7 days before"
        icon="mouse"
      />,
    );

    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });
});

describe('WorkedCard', () => {
  const current = periodTotals();

  it('shows the time worked, how it moved, and how much of it was active', () => {
    renderWithProviders(
      <WorkedCard
        current={current}
        previous={periodTotals({ activeMs: 4 * HOUR })}
        before="the 7 days before"
      />,
    );

    expect(screen.getByText('Worked')).toBeInTheDocument();
    expect(screen.getByText('6h 0m')).toBeInTheDocument();
    expect(screen.getByText('+50%')).toBeInTheDocument();
    expect(screen.getByText('2h 0m idle')).toBeInTheDocument();
    expect(getByA11yLabel('75% of tracked time was active')).toBeInTheDocument();
    expect(screen.getByText('4h 0m the 7 days before.')).toBeInTheDocument();
  });

  it('invents no change when nothing was worked in the period before', () => {
    renderWithProviders(
      <WorkedCard
        current={current}
        previous={periodTotals({ activeMs: 0 })}
        before="the 30 days before"
      />,
    );

    expect(screen.getByText('0m the 30 days before.')).toBeInTheDocument();
    expect(screen.queryByText(/^[+-]?\d+(\.\d+)?%$/)).not.toBeInTheDocument();
  });

  it('words the comparison in the employee’s language', () => {
    renderWithProviders(
      <WorkedCard current={current} previous={current} before="the 7 days before" />,
      { messages: { 'the 7 days before': 'die 7 Tage davor', Worked: 'Gearbeitet' } },
    );

    expect(screen.getByText('Gearbeitet')).toBeInTheDocument();
    expect(screen.getByText('6h 0m die 7 Tage davor.')).toBeInTheDocument();
  });
});
