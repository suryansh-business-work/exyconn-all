import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { ColorValueInput } from '../../../../../../src/pages/website/forms/cms-design-system/ColorValueInput';
import { renderWithProviders } from '../../../../test-utils';

const picker = () => screen.getByLabelText('Pick palette.0.value');

describe('ColorValueInput', () => {
  it('shows a hex value in the picker', () => {
    renderWithProviders(
      <ColorValueInput value=" #155DFC " onChange={vi.fn()} label="palette.0.value" />,
    );
    expect(picker()).toHaveValue('#155dfc');
  });

  it('shows black for a value the picker cannot draw', () => {
    renderWithProviders(
      <ColorValueInput
        value="color-mix(in oklch, red, blue)"
        onChange={vi.fn()}
        label="palette.0.value"
      />,
    );
    expect(picker()).toHaveValue('#000000');
  });

  it('replaces the value with the colour picked', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ColorValueInput
        value="var(--palette-gray-900)"
        onChange={onChange}
        label="palette.0.value"
      />,
    );

    fireEvent.change(picker(), { target: { value: '#ff0000' } });

    expect(onChange).toHaveBeenCalledWith('#ff0000');
  });
});
