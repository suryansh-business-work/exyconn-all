import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPicker } from '@/components/ui/ImageUploadDialog/ColorPicker';

const hexField = () => screen.getByRole('textbox', { name: 'Hex colour' });

describe('ColorPicker', () => {
  it('picks a preset swatch, and ignores a click that would unselect it', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<ColorPicker value="#ffffff" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'White' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Black' }));
    expect(onChange).toHaveBeenLastCalledWith('#000000');

    rerender(<ColorPicker value="#000000" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Black' })).toHaveAttribute('aria-pressed', 'true');
    // The hex field follows a value picked elsewhere.
    expect(hexField()).toHaveValue('#000000');

    onChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Black' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('offers the theme brand colour as a swatch', async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#ffffff" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Brand' }));

    // MUI's default primary, as no app theme is mounted here.
    expect(onChange).toHaveBeenCalledWith('#1976d2');
  });

  it('accepts only a full hex colour typed by hand, and explains a wrong one', async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#ffffff" onChange={onChange} />);

    await userEvent.clear(hexField());
    await userEvent.type(hexField(), '#12G');
    expect(hexField()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Use # and six hex digits, e.g. #ffffff')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.clear(hexField());
    await userEvent.type(hexField(), '#ABCDEF');
    expect(onChange).toHaveBeenCalledWith('#abcdef');
    expect(hexField()).toHaveAttribute('aria-invalid', 'false');
  });

  it('takes a custom colour from the browser picker', () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#ffffff" onChange={onChange} />);

    const native = screen.getByLabelText('Pick a custom colour');
    expect(native).toHaveAttribute('type', 'color');
    fireEvent.change(native, { target: { value: '#336699' } });

    expect(onChange).toHaveBeenCalledWith('#336699');
  });
});
