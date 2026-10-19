import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfProviderSelect } from '../../../../../src/pages/integrations/forms/RhfProviderSelect';
import { renderWithProviders } from '../../../test-utils';
import { chooseOption, optionsOf, press } from '../../../form-helpers';

const schema = z.object({ provider: z.string({ error: 'Pick a provider' }) });

/** A one-field form with no provider chosen, so the select starts empty. */
function ProviderForm({ providers }: Readonly<{ providers: readonly string[] }>) {
  // No default value: the field starts undefined, as an untouched select does.
  const methods = useForm({ resolver: zodResolver(schema) });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => undefined)}>
        <RhfProviderSelect providers={providers} />
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  );
}

describe('RhfProviderSelect', () => {
  it('lists each provider by name, keeping an unknown one as its value', async () => {
    renderWithProviders(<ProviderForm providers={['TWILIO', 'ACME']} />);

    expect(await optionsOf('Provider')).toEqual(['Twilio', 'ACME']);
  });

  it('starts empty, shows the validation message, and clears it once chosen', async () => {
    renderWithProviders(<ProviderForm providers={['TWILIO', 'MSG91']} />);
    expect(screen.getByRole('combobox', { name: /^Provider/ })).not.toHaveTextContent(
      /Twilio|MSG91/,
    );

    await press('Save');
    expect(await screen.findByText('Pick a provider')).toBeInTheDocument();

    await chooseOption('Provider', 'MSG91');
    expect(screen.getByRole('combobox', { name: /^Provider/ })).toHaveTextContent('MSG91');
    expect(screen.queryByText('Pick a provider')).not.toBeInTheDocument();
  });
});
