import { zodResolver } from '@hookform/resolvers/zod';
import { act, fireEvent, screen } from '@testing-library/react';
import { AccessibilityInfo } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { PickerField } from '../../../../src/components/form/PickerField';
import { SelectField } from '../../../../src/components/form/SelectField';
import type { Option } from '../../../../src/components/ui/OptionSheet';
import { Platform } from '../../mocks/react-native/apis';
import { renderWithProviders } from '../../test-utils';

const OPTIONS: Option[] = [
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'BREAK', label: 'Break', caption: 'Back soon' },
];

const schema = z.object({ status: z.string().min(1, 'Choose what you are doing.') });
type Values = z.infer<typeof schema>;

interface HarnessProps {
  initial?: string;
  placeholder?: string;
  busy?: boolean;
  onChanged?: (value: string) => void;
}

function Harness({ initial, placeholder, busy, onChanged }: Readonly<HarnessProps>) {
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { status: initial },
  });
  const status = useWatch({ control, name: 'status' });
  return (
    <>
      <SelectField
        control={control}
        name="status"
        label="Status"
        options={OPTIONS}
        hint="Tells your team where you are."
        placeholder={placeholder}
        busy={busy}
        onChanged={onChanged}
      />
      <output>{`value=${status ?? ''}`}</output>
      <button type="button" onClick={handleSubmit(() => undefined)}>
        Submit
      </button>
    </>
  );
}

describe('SelectField', () => {
  it('shows the default placeholder until something is chosen', () => {
    renderWithProviders(<Harness />);
    expect(screen.getByRole('button', { name: 'Status: Choose…' })).toBeInTheDocument();
    expect(screen.getByText('Tells your team where you are.')).toBeInTheDocument();
  });

  it('writes the chosen option into the form and reports the change', () => {
    const onChanged = vi.fn();
    renderWithProviders(<Harness placeholder="Pick one" onChanged={onChanged} />);
    fireEvent.click(screen.getByRole('button', { name: 'Status: Pick one' }));
    expect(screen.getByText('Back soon')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Break' }));
    expect(screen.getByText('value=BREAK')).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledWith('BREAK');
    expect(screen.getByRole('button', { name: 'Status: Break' })).toBeInTheDocument();
  });

  it('writes the choice even when nobody listens for the change', () => {
    renderWithProviders(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Status: Choose…' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Lunch' }));
    expect(screen.getByText('value=LUNCH')).toBeInTheDocument();
  });

  it('replaces the hint with the schema’s message', async () => {
    renderWithProviders(<Harness initial="" />);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Choose what you are doing.')).toBeInTheDocument();
    expect(screen.queryByText('Tells your team where you are.')).toBeNull();
  });

  it('holds presses while its choice is being saved', () => {
    renderWithProviders(<Harness busy />);
    const field = screen.getByRole('button', { name: 'Status: Choose…' });
    expect(field).toHaveAttribute('aria-busy', 'true');
    expect(field).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('PickerField', () => {
  function renderPicker(onSelect = vi.fn(), selected = 'LUNCH') {
    renderWithProviders(
      <PickerField
        id="presence"
        label="Presence"
        options={OPTIONS}
        selected={selected}
        placeholder="Choose"
        disabled={false}
        onSelect={onSelect}
      />,
    );
    return onSelect;
  }

  it('shows the current choice and hints how to change it', () => {
    renderPicker();
    const field = screen.getByRole('button', { name: 'Presence: Lunch' });
    expect(field).toHaveAttribute('aria-description', 'Opens the list of choices');
    expect(screen.getByTestId('icon-chevron-down')).toBeInTheDocument();
  });

  it('falls back to the placeholder for a value that is not in the list', () => {
    renderPicker(vi.fn(), 'GONE');
    expect(screen.getByRole('button', { name: 'Presence: Choose' })).toBeInTheDocument();
  });

  it('closes the sheet without choosing', () => {
    const onSelect = renderPicker();
    fireEvent.click(screen.getByRole('button', { name: 'Presence: Lunch' }));
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('radio')).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('on Android hands the screen reader back to the field once the sheet has gone', () => {
    vi.useFakeTimers();
    Platform.OS = 'android';
    renderPicker();
    const field = screen.getByRole('button', { name: 'Presence: Lunch' });
    fireEvent.click(field);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(AccessibilityInfo.sendAccessibilityEvent).toHaveBeenLastCalledWith(field, 'focus');
  });

  it('says so when a search matches nothing', () => {
    renderWithProviders(
      <PickerField
        id="presence"
        label="Presence"
        options={OPTIONS}
        selected=""
        placeholder="Choose"
        disabled={false}
        searchable
        onSelect={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Presence: Choose' }));
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'dinner' } });
    expect(screen.getByText('Nothing matches.')).toBeInTheDocument();
  });

  it('outlines an error in place of the hint', () => {
    renderWithProviders(
      <PickerField
        id="presence"
        label="Presence"
        options={OPTIONS}
        selected=""
        placeholder="Choose"
        hint="Optional."
        error="Choose one."
        disabled
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('Choose one.')).toBeInTheDocument();
    expect(screen.queryByText('Optional.')).toBeNull();
    expect(screen.getByTestId('icon-lock-outline')).toBeInTheDocument();
  });
});
