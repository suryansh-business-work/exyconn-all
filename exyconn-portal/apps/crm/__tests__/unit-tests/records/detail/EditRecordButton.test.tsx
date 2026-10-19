import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditRecordButton } from '../../../../src/records/detail/EditRecordButton';
import { renderWithProviders } from '../../test-utils';

describe('EditRecordButton', () => {
  it('is an outlined button with the edit icon by default', () => {
    renderWithProviders(
      <EditRecordButton label="Edit company" renderForm={() => null} onSaved={vi.fn()} />,
    );
    const button = screen.getByRole('button', { name: 'Edit company' });
    expect(button).toHaveClass('MuiButton-outlined');
    expect(screen.getByTestId('EditIcon')).toBeInTheDocument();
  });

  it('is a plain text button with no icon when textOnly, and still opens the form', async () => {
    renderWithProviders(
      <EditRecordButton
        label="Edit contact"
        textOnly
        renderForm={() => <p>The contact form</p>}
        onSaved={vi.fn()}
      />,
    );
    const button = screen.getByRole('button', { name: 'Edit contact' });
    expect(button).toHaveClass('MuiButton-text');
    expect(button).toHaveTextContent('Edit');
    expect(screen.queryByTestId('EditIcon')).not.toBeInTheDocument();
    await userEvent.click(button);
    expect(await screen.findByText('The contact form')).toBeInTheDocument();
  });
});
