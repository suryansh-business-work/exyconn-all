import { createRef, forwardRef, type ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Checkbox } from '../../../src/inputs';

describe('Checkbox', () => {
  it('is a plain checkbox that is not half-ticked by default', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} slotProps={{ input: { 'aria-label': 'Accept' } }} />);
    const box = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Accept' });
    expect(box.indeterminate).toBe(false);
    expect(box).not.toHaveAttribute('aria-checked');
    expect(ref.current).toContainElement(box);
  });

  it('marks the half-ticked state on the native input instead of aria-checked', () => {
    const { rerender } = render(
      <Checkbox indeterminate slotProps={{ input: { 'aria-label': 'All rows' } }} />,
    );
    const box = screen.getByRole<HTMLInputElement>('checkbox', { name: 'All rows' });
    expect(box.indeterminate).toBe(true);
    expect(box).not.toHaveAttribute('aria-checked');

    rerender(
      <Checkbox indeterminate={false} slotProps={{ input: { 'aria-label': 'All rows' } }} />,
    );
    expect(box.indeterminate).toBe(false);
  });

  it('still hands the native input to a ref the caller passed through slotProps', () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <Checkbox indeterminate slotProps={{ input: { ref: inputRef, 'aria-label': 'Pick' } }} />,
    );
    const box = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Pick' });
    expect(inputRef.current).toBe(box);
    expect(box.indeterminate).toBe(true);
  });

  it('resolves a slotProps.input callback and still strips aria-checked from it', () => {
    const input = vi.fn(() => ({ 'aria-label': 'From state', 'aria-checked': 'mixed' as const }));
    render(<Checkbox indeterminate slotProps={{ input }} />);
    const box = screen.getByRole<HTMLInputElement>('checkbox', { name: 'From state' });
    expect(input).toHaveBeenCalled();
    expect(box).not.toHaveAttribute('aria-checked');
    expect(box.indeterminate).toBe(true);
  });

  it('reports a change through onChange', () => {
    const onChange = vi.fn();
    render(<Checkbox onChange={onChange} slotProps={{ input: { 'aria-label': 'Toggle' } }} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Toggle' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][1]).toBe(true);
  });

  it('copes with a custom input slot that never attaches the ref', () => {
    const Plain = forwardRef<HTMLInputElement, ComponentProps<'input'>>(function Plain(
      { type, 'aria-label': label },
      _ref,
    ) {
      return <input type={type} aria-label={label} readOnly />;
    });
    render(
      <Checkbox
        indeterminate
        slots={{ input: Plain }}
        slotProps={{ input: { 'aria-label': 'Custom' } }}
      />,
    );
    const box = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Custom' });
    // The ref never reached the element, so the native mixed state could not be set.
    expect(box.indeterminate).toBe(false);
  });
});
