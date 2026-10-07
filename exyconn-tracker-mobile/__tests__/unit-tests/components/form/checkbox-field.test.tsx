import { fireEvent, screen } from '@testing-library/react';
import { useForm, useWatch } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { CheckboxField } from '../../../../src/components/form/CheckboxField';
import { renderWithProviders } from '../../test-utils';

interface Values {
  agree: boolean;
}

function Harness({ initial, disabled }: Readonly<{ initial: boolean; disabled?: boolean }>) {
  const { control } = useForm<Values>({ defaultValues: { agree: initial } });
  const agree = useWatch({ control, name: 'agree' });
  return (
    <>
      <CheckboxField control={control} name="agree" label="I agree" disabled={disabled} />
      <output>{agree ? 'agreed' : 'not agreed'}</output>
    </>
  );
}

function box(): HTMLElement {
  return screen.getByRole('checkbox', { name: 'I agree' });
}

describe('CheckboxField', () => {
  it('reads as one labelled checkbox and toggles the form value on a tap', () => {
    renderWithProviders(<Harness initial={false} />);
    expect(box()).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('I agree')).toBeInTheDocument();

    fireEvent.click(box());
    expect(box()).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('agreed')).toBeInTheDocument();

    fireEvent.click(box());
    expect(box()).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('not agreed')).toBeInTheDocument();
  });

  it('starts from the form’s own value', () => {
    renderWithProviders(<Harness initial />);
    expect(box()).toHaveAttribute('aria-checked', 'true');
  });

  it('ignores taps while disabled', () => {
    renderWithProviders(<Harness initial={false} disabled />);
    expect(box()).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(box());
    expect(box()).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('not agreed')).toBeInTheDocument();
  });
});
