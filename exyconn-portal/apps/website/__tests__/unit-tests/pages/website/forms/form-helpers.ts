import { screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';

export type User = ReturnType<typeof userEvent.setup>;

/** A text field (input or textarea) by its label. */
export const field = (name: string) => screen.getByRole('textbox', { name });

/** Opens an MUI select by its label and picks one of its options. */
export async function pickOption(user: User, select: string, option: string) {
  await user.click(screen.getByRole('combobox', { name: select }));
  await user.click(screen.getByRole('option', { name: option }));
}
