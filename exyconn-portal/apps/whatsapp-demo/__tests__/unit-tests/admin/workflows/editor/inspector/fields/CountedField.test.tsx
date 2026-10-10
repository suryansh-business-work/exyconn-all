import { screen, waitFor } from '@testing-library/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { FieldValues, Resolver } from 'react-hook-form';
import { CountedField } from '../../../../../../../src/admin/workflows/editor/inspector/fields/CountedField';
import { renderField, replaceText, submitted } from '../node-form-helpers';

const resolver = zodResolver(
  z.object({ title: z.string().min(1, 'Title is required') }),
) as unknown as Resolver<FieldValues>;

describe('CountedField', () => {
  it('shows the hint and a live count against the limit', async () => {
    const { user, onSubmit, submit } = renderField(
      <CountedField name="title" label="Title" max={10} hint="Shown on the card" />,
      { title: 'Hello' },
    );
    const field = screen.getByRole('textbox', { name: 'Title' });
    expect(screen.getByText('Shown on the card')).toBeInTheDocument();
    expect(screen.getByText('5/10')).toBeInTheDocument();
    await replaceText(user, field, 'Good day');
    expect(screen.getByText('8/10')).toBeInTheDocument();
    await submit();
    expect((await submitted(onSubmit)).title).toBe('Good day');
  });

  it('marks text over the limit as an error while typing', async () => {
    const { user } = renderField(<CountedField name="title" label="Title" max={3} />, {
      title: 'abc',
    });
    const field = screen.getByRole('textbox', { name: 'Title' });
    expect(field).toHaveAttribute('aria-invalid', 'false');
    await user.type(field, 'd');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('4/3')).toBeInTheDocument();
  });

  it('shows the validation message in place of the hint', async () => {
    const { user, submit } = renderField(
      <CountedField name="title" label="Title" hint="Shown on the card" />,
      { title: '' },
      { resolver },
    );
    await submit();
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.queryByText('Shown on the card')).toBeNull();
    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Ok');
    await waitFor(() => expect(screen.queryByText('Title is required')).toBeNull());
  });

  it('shows a number as text, an unset value as empty, and has no counter without a limit', () => {
    renderField(
      <>
        <CountedField name="count" label="Count" />
        <CountedField name="missing" label="Missing" multiline disabled />
      </>,
      { count: 42 },
    );
    expect(screen.getByRole('textbox', { name: 'Count' })).toHaveValue('42');
    const missing = screen.getByRole('textbox', { name: 'Missing' });
    expect(missing).toHaveValue('');
    expect(missing).toBeDisabled();
    expect(missing.tagName).toBe('TEXTAREA');
    expect(screen.queryByText(/\d\/\d/)).toBeNull();
  });

  it('translates its label, hint and counter', () => {
    renderField(
      <CountedField name="title" label="Title" max={5} hint="Short" />,
      { title: 'ab' },
      { messages: { Title: 'Titel', Short: 'Kurz', '{count}/{max}': '{count} von {max}' } },
    );
    expect(screen.getByRole('textbox', { name: 'Titel' })).toBeInTheDocument();
    expect(screen.getByText('Kurz')).toBeInTheDocument();
    expect(screen.getByText('2 von 5')).toBeInTheDocument();
  });
});
