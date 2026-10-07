import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MenuItem } from '../../../src';
import { Radio, RadioGroup, Select, Switch } from '../../../src/inputs';

describe('Radio and RadioGroup', () => {
  it('groups radios, reports the picked value and forwards refs', () => {
    const groupRef = createRef<HTMLDivElement>();
    const radioRef = createRef<HTMLButtonElement>();
    const onChange = vi.fn();
    render(
      <RadioGroup ref={groupRef} name="plan" defaultValue="free" onChange={onChange}>
        <Radio ref={radioRef} value="free" slotProps={{ input: { 'aria-label': 'Free' } }} />
        <Radio value="pro" slotProps={{ input: { 'aria-label': 'Pro' } }} />
      </RadioGroup>,
    );
    expect(groupRef.current).toHaveAttribute('role', 'radiogroup');
    expect(screen.getByRole('radio', { name: 'Free' })).toBeChecked();
    expect(radioRef.current).toContainElement(screen.getByRole('radio', { name: 'Free' }));

    fireEvent.click(screen.getByRole('radio', { name: 'Pro' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][1]).toBe('pro');
    expect(screen.getByRole('radio', { name: 'Pro' })).toBeChecked();
  });
});

describe('Switch', () => {
  it('is a switch that toggles and forwards its ref', () => {
    const ref = createRef<HTMLButtonElement>();
    const onChange = vi.fn();
    render(
      <Switch ref={ref} onChange={onChange} slotProps={{ input: { 'aria-label': 'Dark' } }} />,
    );
    const control = screen.getByRole('switch', { name: 'Dark' });
    expect(control).not.toBeChecked();
    expect(ref.current).toContainElement(control);
    fireEvent.click(control);
    expect(onChange.mock.calls[0][1]).toBe(true);
    expect(control).toBeChecked();
  });
});

describe('Select', () => {
  it('opens its options and reports the chosen value', () => {
    const ref = createRef<HTMLDivElement>();
    const onChange = vi.fn();
    render(
      <Select ref={ref} value="a" onChange={onChange} inputProps={{ 'aria-label': 'Letter' }}>
        <MenuItem value="a">Alpha</MenuItem>
        <MenuItem value="b">Bravo</MenuItem>
      </Select>,
    );
    expect(ref.current).toHaveClass('MuiInputBase-root');
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('Alpha');
    fireEvent.mouseDown(trigger);
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Bravo'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.value).toBe('b');
  });
});
