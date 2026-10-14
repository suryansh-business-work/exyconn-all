import { screen, within } from '@testing-library/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { FieldValues, Resolver } from 'react-hook-form';
import { KeySelect } from '../../../../../../../src/admin/workflows/editor/inspector/fields/KeySelect';
import { pickOption, renderField, submitted } from '../node-form-helpers';

describe('KeySelect', () => {
  it('picks one of the keys, shown as written by default', async () => {
    const { user, onSubmit, submit } = renderField(
      <KeySelect name="accent" label="Accent" keys={['teal', 'blue']} hint="Card tint" />,
      { accent: 'teal' },
      { messages: { blue: 'Blau' } },
    );
    expect(screen.getByRole('combobox', { name: 'Accent' })).toHaveTextContent('teal');
    expect(screen.getByText('Card tint')).toBeInTheDocument();
    await pickOption(user, 'Accent', 'blue');
    await submit();
    expect((await submitted(onSubmit)).accent).toBe('blue');
  });

  it('translates options when asked and offers "not set" as undefined', async () => {
    const { user, onSubmit, submit } = renderField(
      <KeySelect name="flag" label="Flag" keys={['high', 'low']} translate emptyLabel="None" />,
      { flag: 'high' },
      { messages: { high: 'Hoch', None: 'Keins' } },
    );
    expect(screen.getByRole('combobox', { name: 'Flag' })).toHaveTextContent('Hoch');
    await pickOption(user, 'Flag', 'Keins');
    // "Not set" stores `undefined`, so the select shows nothing rather than the old option.
    expect(screen.getByRole('combobox', { name: 'Flag' })).not.toHaveTextContent('Hoch');
    await submit();
    expect((await submitted(onSubmit)).flag).toBeUndefined();
  });

  it('draws the WhatsApp icon beside each icon key', async () => {
    const { user } = renderField(
      <KeySelect name="icon" label="Icon" keys={['business', 'chat']} icons />,
      { icon: undefined },
    );
    expect(screen.getByRole('combobox', { name: 'Icon' })).not.toHaveTextContent(/\w/);
    await user.click(screen.getByRole('combobox', { name: 'Icon' }));
    const option = await screen.findByRole('option', { name: 'chat' });
    expect(within(option).getByTestId(/Icon$/)).toBeInTheDocument();
  });

  it('shows a validation error instead of the hint', async () => {
    const resolver = zodResolver(
      z.object({ kind: z.string('Pick a kind') }),
    ) as unknown as Resolver<FieldValues>;
    const { submit } = renderField(
      <KeySelect name="kind" label="Kind" keys={['a']} hint="What it is" />,
      {},
      { resolver },
    );
    await submit();
    expect(await screen.findByText('Pick a kind')).toBeInTheDocument();
    expect(screen.queryByText('What it is')).toBeNull();
    expect(screen.getByRole('combobox', { name: 'Kind' })).toHaveAttribute('aria-invalid', 'true');
  });
});
