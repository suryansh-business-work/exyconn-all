import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  SegmentedControl,
  type SegmentOption,
} from '../../../../src/components/ui/SegmentedControl';
import { trackerSelected } from '../../../../src/theme/tokens';
import { renderWithProviders } from '../../test-utils';

type View = 'chart' | 'table';

const VIEWS: SegmentOption<View>[] = [
  { value: 'chart', label: 'Chart', icon: 'chart-bar' },
  { value: 'table', label: 'Table', icon: 'table', accessibilityLabel: 'Table of days' },
];

describe('SegmentedControl', () => {
  it('announces views of one screen as tabs, the current one selected', () => {
    renderWithProviders(
      <SegmentedControl options={VIEWS} value="chart" onChange={vi.fn()} label="Report view" />,
    );
    expect(screen.getByRole('tab', { name: 'Chart' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Table of days' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('draws the selected icon in the pill ink', () => {
    renderWithProviders(
      <SegmentedControl options={VIEWS} value="chart" onChange={vi.fn()} label="Report view" />,
    );
    expect(screen.getByTestId('icon-chart-bar')).toHaveAttribute(
      'data-color',
      trackerSelected.light.ink,
    );
  });

  it('switches to the option pressed', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <SegmentedControl options={VIEWS} value="chart" onChange={onChange} label="Report view" />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Table of days' }));
    expect(onChange).toHaveBeenCalledWith('table');
  });

  it('announces a setting as radio choices, the current one checked', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <SegmentedControl
        options={[
          { value: 'bar', label: 'Bar' },
          { value: 'ring', label: 'Ring' },
        ]}
        value="ring"
        onChange={onChange}
        label="Progress style"
        kind="choice"
        full
      />,
    );
    expect(screen.getByRole('radio', { name: 'Ring' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Bar' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByTestId(/^icon-/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Bar' }));
    expect(onChange).toHaveBeenCalledWith('bar');
  });
});
