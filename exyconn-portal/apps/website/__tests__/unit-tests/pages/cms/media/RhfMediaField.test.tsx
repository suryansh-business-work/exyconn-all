import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { RhfMediaField } from '../../../../../src/pages/cms/media';
import { renderWithProviders } from '../../../test-utils';

interface Values {
  coverImage?: string;
}

/** A form that shows its current value and can fail validation on demand. */
function Harness({ children, initial }: Readonly<{ children: ReactNode; initial: Values }>) {
  const methods = useForm<Values>({ defaultValues: initial });
  const value = methods.watch('coverImage');
  return (
    <FormProvider {...methods}>
      {children}
      <output aria-label="value">{value ?? 'unset'}</output>
      <button
        type="button"
        onClick={() => methods.setError('coverImage', { message: 'Enter an image URL' })}
      >
        Fail validation
      </button>
    </FormProvider>
  );
}

const renderField = (initial: Values = {}) =>
  renderWithProviders(
    <Harness initial={initial}>
      <RhfMediaField name="coverImage" label="Cover image" helperText="Shown on cards" />
    </Harness>,
  );

describe('RhfMediaField', () => {
  it('shows an unset value as an empty field, with its hint', () => {
    renderField();

    expect(screen.getByRole('textbox', { name: 'Cover image' })).toHaveValue('');
    expect(screen.getByText('Shown on cards')).toBeInTheDocument();
  });

  it('writes what is typed into the form', async () => {
    renderField({ coverImage: 'https://cdn/' });
    await userEvent.type(screen.getByRole('textbox', { name: 'Cover image' }), 'a.png');

    expect(screen.getByLabelText('value')).toHaveTextContent('https://cdn/a.png');
  });

  it("shows the form's validation error instead of the hint", async () => {
    renderField();
    await userEvent.click(screen.getByRole('button', { name: 'Fail validation' }));

    expect(screen.getByText('Enter an image URL')).toBeInTheDocument();
    expect(screen.queryByText('Shown on cards')).not.toBeInTheDocument();
  });
});
