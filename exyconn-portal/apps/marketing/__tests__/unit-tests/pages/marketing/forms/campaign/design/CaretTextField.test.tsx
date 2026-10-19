import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaretTextField } from '../../../../../../../src/pages/marketing/forms/campaign/design/CaretTextField';
import { renderWithProviders } from '../../../../../test-utils';
import { VARIABLES } from '../studio.fixtures';

/** A controlled CaretTextField, the way the studio's fields hold their value. */
function Controlled({
  initial,
  onChange,
  withVariables = true,
}: Readonly<{ initial: string; onChange: (value: string) => void; withVariables?: boolean }>) {
  const [value, setValue] = useState(initial);
  return (
    <CaretTextField
      label="Email subject"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      helperText="Keep it short"
      variables={withVariables ? VARIABLES : undefined}
    />
  );
}

const pickFirstName = async () => {
  await userEvent.click(screen.getByRole('combobox', { name: 'Insert variable' }));
  await userEvent.click(screen.getByRole('option', { name: /First name/ }));
};

describe('CaretTextField', () => {
  it('passes typing through and shows its hint', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Controlled initial="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Email subject'), 'Hi');
    expect(onChange).toHaveBeenLastCalledWith('Hi');
    expect(screen.getByText('Keep it short')).toBeInTheDocument();
  });

  it('inserts a variable where the caret was, replacing a selection, and keeps focus', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Controlled initial="Hello friend, welcome" onChange={onChange} />);
    const input = screen.getByLabelText<HTMLInputElement>('Email subject');
    input.setSelectionRange(6, 12);
    await pickFirstName();
    expect(onChange).toHaveBeenLastCalledWith('Hello {{contact.firstName|there}}, welcome');
    await waitFor(() => expect(input).toHaveFocus());
    const caret = 'Hello {{contact.firstName|there}}'.length;
    expect([input.selectionStart, input.selectionEnd]).toEqual([caret, caret]);
  });

  it('adds the variable at the end when the field has no caret', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Controlled initial="Hi " onChange={onChange} />);
    const input = screen.getByLabelText<HTMLInputElement>('Email subject');
    const proto = HTMLInputElement.prototype;
    const start = Object.getOwnPropertyDescriptor(proto, 'selectionStart')?.get;
    const end = Object.getOwnPropertyDescriptor(proto, 'selectionEnd')?.get;
    const noCaret = (getter: (() => number | null) | undefined) =>
      function (this: HTMLInputElement) {
        return this === input ? null : (getter?.call(this) ?? null);
      };
    const startSpy = vi.spyOn(proto, 'selectionStart', 'get').mockImplementation(noCaret(start));
    const endSpy = vi.spyOn(proto, 'selectionEnd', 'get').mockImplementation(noCaret(end));
    await pickFirstName();
    startSpy.mockRestore();
    endSpy.mockRestore();
    expect(onChange).toHaveBeenLastCalledWith('Hi {{contact.firstName|there}}');
  });

  it('offers no picker without variables, and grows for long text', () => {
    renderWithProviders(
      <CaretTextField label="Footer text" value={'a\nb'} onChange={vi.fn()} multiline />,
    );
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Footer text').tagName).toBe('TEXTAREA');
    fireEvent.change(screen.getByLabelText('Footer text'), { target: { value: 'c' } });
  });
});
