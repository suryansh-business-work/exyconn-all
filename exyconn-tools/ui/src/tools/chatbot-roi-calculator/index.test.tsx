import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ChatbotROICalculator from './index';
import ROIInputSlider from './components/ROIInputSlider';
import ROIResultCard from './components/ROIResultCard';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../../__tests__/helpers/toolHarness')).toolLayoutStub()
);

const spinbuttons = () => screen.getAllByRole('spinbutton');

describe('ChatbotROICalculator', () => {
  it('shows the savings worked out from the default inputs', () => {
    render(<ChatbotROICalculator />);
    expect(screen.getByRole('heading', { name: 'Chatbot ROI Calculator' })).toBeInTheDocument();
    expect(spinbuttons().map((input) => (input as HTMLInputElement).value)).toEqual(['14', '103', '109', '14']);
    // 103 * 12 tickets * 14% * (109 / 60) h * $14 = $4,400.98 against the $948 plan.
    expect(screen.getByText('$4,401 /yr')).toBeInTheDocument();
    expect(screen.getByText('314.4 hours /yr')).toBeInTheDocument();
    expect(screen.getByText('364%')).toBeInTheDocument();
    expect(screen.getByText('$948 /yr')).toBeInTheDocument();
  });

  it('recalculates when a number field changes and clamps it to the range', () => {
    render(<ChatbotROICalculator />);
    fireEvent.change(spinbuttons()[3], { target: { value: '500' } });
    expect(spinbuttons()[3]).toHaveValue(100);
    // 1236 tickets * 100% * (109 / 60) h = 2,245.4 h, at $14 = $31,435.60.
    expect(screen.getByText('$31,436 /yr')).toBeInTheDocument();
    expect(screen.getByText('2,245 hours /yr')).toBeInTheDocument();
  });

  it('falls back to the minimum when a number field is emptied', () => {
    render(<ChatbotROICalculator />);
    fireEvent.change(spinbuttons()[1], { target: { value: '' } });
    expect(spinbuttons()[1]).toHaveValue(1);
  });

  it('recalculates when a slider moves', () => {
    render(<ChatbotROICalculator />);
    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: '100' } });
    expect(spinbuttons()[0]).toHaveValue(100);
    // 173.04 automated tickets * (109 / 60) h * $100 = $31,436.
    expect(screen.getByText('$31,436 /yr')).toBeInTheDocument();
  });

  it('reports a negative ROI as an error card without the highlight', () => {
    render(<ChatbotROICalculator />);
    fireEvent.change(spinbuttons()[1], { target: { value: '1' } });
    fireEvent.change(spinbuttons()[2], { target: { value: '1' } });
    // 12 tickets * 14% * (1 / 60) h * $14 = $0.39 a year does not cover the $948 plan: ROI = -100%.
    expect(screen.getByText('-100%')).toBeInTheDocument();
    expect(screen.getByText('$0.39 /yr')).toBeInTheDocument();
    expect(screen.getByText('0.0 hours /yr')).toBeInTheDocument();
  });

  it('abbreviates savings in millions', () => {
    render(<ChatbotROICalculator />);
    fireEvent.change(spinbuttons()[0], { target: { value: '200' } });
    fireEvent.change(spinbuttons()[1], { target: { value: '2000' } });
    fireEvent.change(spinbuttons()[2], { target: { value: '200' } });
    fireEvent.change(spinbuttons()[3], { target: { value: '100' } });
    // 24000 tickets * (200 / 60) h * $200 = $16,000,000.
    expect(screen.getByText('$16.00M /yr')).toBeInTheDocument();
    expect(screen.getByText('80,000 hours /yr')).toBeInTheDocument();
  });

  it('restores the defaults on reset', () => {
    render(<ChatbotROICalculator />);
    fireEvent.change(spinbuttons()[0], { target: { value: '50' } });
    expect(spinbuttons()[0]).toHaveValue(50);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(spinbuttons()[0]).toHaveValue(14);
    expect(screen.getByText('$4,401 /yr')).toBeInTheDocument();
  });
});

describe('ROIInputSlider', () => {
  it('derives quarter marks and shows the helper text and unit when given', () => {
    render(
      <ROIInputSlider label="Agents" value={5} min={0} max={100} unit="ppl" helperText="Per shift" onChange={vi.fn()} />
    );
    expect(screen.getByText('Per shift')).toBeInTheDocument();
    expect(screen.getByText('ppl')).toBeInTheDocument();
    ['0', '25', '50', '75', '100'].forEach((mark) => expect(screen.getByText(mark)).toBeInTheDocument());
  });

  it('reports slider and clamped input changes', () => {
    const onChange = vi.fn();
    render(<ROIInputSlider label="Agents" value={5} min={1} max={10} onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } });
    expect(onChange).toHaveBeenLastCalledWith(7);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '99' } });
    expect(onChange).toHaveBeenLastCalledWith(10);
  });
});

describe('ROIResultCard', () => {
  it('renders the subtitle and icon when given and omits them otherwise', () => {
    const { rerender } = render(
      <ROIResultCard label="Net" value="$5" subtitle="per year" icon={<span data-testid="icon" />} color="warning" />
    );
    expect(screen.getByText('per year')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    rerender(<ROIResultCard label="Net" value="$5" color="info" highlighted />);
    expect(screen.queryByText('per year')).toBeNull();
    expect(screen.queryByTestId('icon')).toBeNull();
    expect(screen.getByText('$5')).toBeInTheDocument();
  });
});
