import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FontRolesFields } from '../../../../../../src/pages/website/forms/cms-design-system/FontRolesFields';
import { renderWithProviders } from '../../../../test-utils';
import { DesignHarness, type FieldError } from './design-harness';
import type { User } from '../form-helpers';

const ROLES = [
  { key: 'sans', value: '"Inter", sans-serif' },
  { key: 'mono', value: '"Old Mono", monospace' },
];

function setup(errors?: readonly FieldError[]) {
  const onSubmit = vi.fn();
  renderWithProviders(
    <DesignHarness values={{ fonts: ROLES }} errors={errors} onSubmit={onSubmit}>
      <FontRolesFields families={['Inter', 'Lora']} />
    </DesignHarness>,
  );
  return { user: userEvent.setup(), onSubmit };
}

/** Picks an option in the n-th select of that label (one per role). */
async function choose(user: User, label: string, index: number, option: string) {
  await user.click(screen.getAllByRole('combobox', { name: label })[index]);
  await user.click(screen.getByRole('option', { name: option }));
}

async function savedFonts(user: User, onSubmit: ReturnType<typeof vi.fn>) {
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  return onSubmit.mock.calls[0][0].fonts;
}

describe('FontRolesFields', () => {
  it('shows each role as a family and a fallback, with its custom property', () => {
    setup();

    expect(screen.getAllByRole('textbox', { name: 'Role' })[0]).toHaveValue('sans');
    expect(screen.getByText('--font-family-sans')).toBeInTheDocument();
    const families = screen.getAllByRole('combobox', { name: 'Family' });
    expect(families[0]).toHaveTextContent('Inter');
    expect(families[1]).toHaveTextContent('Old Mono');
    expect(screen.getAllByRole('combobox', { name: 'Fallback' })[1]).toHaveTextContent('monospace');
    expect(screen.getByText('"Inter", sans-serif')).toBeInTheDocument();
  });

  it('keeps a family that is not loaded selectable', async () => {
    const { user } = setup();

    await user.click(screen.getAllByRole('combobox', { name: 'Family' })[1]);

    expect(screen.getByRole('option', { name: 'Old Mono' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Lora' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fallback only' })).toBeInTheDocument();
  });

  it('builds the stack from the family and fallback picked', async () => {
    const { user, onSubmit } = setup();

    await choose(user, 'Family', 0, 'Lora');
    await choose(user, 'Fallback', 0, 'serif');
    await choose(user, 'Family', 1, 'Fallback only');

    expect(await savedFonts(user, onSubmit)).toEqual([
      { key: 'sans', value: '"Lora", serif' },
      { key: 'mono', value: 'monospace' },
    ]);
  });

  it('adds a role on the sans fallback and removes one', async () => {
    const { user, onSubmit } = setup();

    await user.click(screen.getByRole('button', { name: 'Add role' }));
    await user.type(screen.getAllByRole('textbox', { name: 'Role' })[2], 'display');
    await user.click(screen.getByRole('button', { name: 'Remove role 1' }));

    expect(await savedFonts(user, onSubmit)).toEqual([
      ROLES[1],
      { key: 'display', value: 'sans-serif' },
    ]);
  });

  it('shows the errors of a role in place of its hints', async () => {
    const { user } = setup([
      { name: 'fonts.0.key', message: 'This name is used twice' },
      { name: 'fonts.1.value', message: 'A CSS value without ; { } < >, up to 300 characters' },
    ]);

    await user.click(screen.getByRole('button', { name: 'Show errors' }));

    expect(await screen.findByText('This name is used twice')).toBeInTheDocument();
    expect(screen.queryByText('--font-family-sans')).not.toBeInTheDocument();
    expect(
      screen.getByText('A CSS value without ; { } < >, up to 300 characters'),
    ).toBeInTheDocument();
    expect(screen.queryByText('"Old Mono", monospace')).not.toBeInTheDocument();
  });
});
