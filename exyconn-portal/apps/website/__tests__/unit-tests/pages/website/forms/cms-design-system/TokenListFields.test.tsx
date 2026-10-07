import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TokenListFields } from '../../../../../../src/pages/website/forms/cms-design-system/TokenListFields';
import { renderWithProviders } from '../../../../test-utils';
import { DesignHarness, EMPTY_DESIGN, type FieldError } from './design-harness';

const PALETTE = [
  { key: 'gray-900', value: '#111827' },
  { key: 'brand-500', value: 'oklch(70% 0.2 50)' },
];

interface SetupOptions {
  colors?: boolean;
  errors?: readonly FieldError[];
}

function setup({ colors = false, errors }: Readonly<SetupOptions> = {}) {
  const onSubmit = vi.fn();
  renderWithProviders(
    <DesignHarness values={{ palette: PALETTE }} errors={errors} onSubmit={onSubmit}>
      <TokenListFields
        name="palette"
        prefix="--palette-"
        colors={colors}
        hint="Raw colour ramps."
      />
    </DesignHarness>,
  );
  return { user: userEvent.setup(), onSubmit };
}

const names = () => screen.getAllByRole('textbox', { name: 'Name' });
const values = () => screen.getAllByRole('textbox', { name: 'Value' });

describe('TokenListFields', () => {
  it('lists each token with the custom property it becomes', () => {
    setup();

    expect(screen.getByText('Raw colour ramps.')).toBeInTheDocument();
    expect(names()[0]).toHaveValue('gray-900');
    expect(names()[1]).toHaveValue('brand-500');
    expect(values()[1]).toHaveValue('oklch(70% 0.2 50)');
    expect(screen.getByText('--palette-gray-900')).toBeInTheDocument();
    expect(screen.queryByLabelText('Pick palette.0.value')).not.toBeInTheDocument();
  });

  it('adds an empty token and removes one', async () => {
    const { user, onSubmit } = setup();

    await user.click(screen.getByRole('button', { name: 'Add token' }));
    expect(names()).toHaveLength(3);
    await user.type(names()[2], 'accent');
    await user.type(values()[2], 'red');
    await user.click(screen.getByRole('button', { name: 'Remove token 1' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { ...EMPTY_DESIGN, palette: [PALETTE[1], { key: 'accent', value: 'red' }] },
        expect.anything(),
      ),
    );
  });

  it('puts a colour picker beside each value of a colour group', async () => {
    const { user, onSubmit } = setup({ colors: true });

    expect(screen.getByLabelText('Pick palette.0.value')).toHaveValue('#111827');
    fireEvent.change(screen.getByLabelText('Pick palette.1.value'), {
      target: { value: '#f9851f' },
    });
    expect(values()[1]).toHaveValue('#f9851f');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { ...EMPTY_DESIGN, palette: [PALETTE[0], { key: 'brand-500', value: '#f9851f' }] },
        expect.anything(),
      ),
    );
  });

  it("shows a row's errors in place of its hint", async () => {
    const { user } = setup({
      errors: [
        { name: 'palette.0.key', message: 'This name is used twice' },
        { name: 'palette.1.value', message: 'A CSS value without ; { } < >, up to 300 characters' },
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Show errors' }));

    expect(await screen.findByText('This name is used twice')).toBeInTheDocument();
    expect(screen.queryByText('--palette-gray-900')).not.toBeInTheDocument();
    expect(
      screen.getByText('A CSS value without ; { } < >, up to 300 characters'),
    ).toBeInTheDocument();
  });
});
