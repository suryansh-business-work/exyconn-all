import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { EmailCheckForm } from '../../../../../../src/pages/email-verifier/forms/email-check';
import { renderWithProviders } from '../../../../test-utils';
import { fillField, press } from '../../../../form-helpers';

function renderForm(checking = false) {
  const onCheck = vi.fn();
  renderWithProviders(<EmailCheckForm checking={checking} onCheck={onCheck} />);
  return onCheck;
}

describe('EmailCheckForm', () => {
  it('asks for an address before checking', async () => {
    const onCheck = renderForm();

    await press('Check');

    expect(await screen.findByText('Enter an email address')).toBeInTheDocument();
    expect(onCheck).not.toHaveBeenCalled();
  });

  it('rejects a malformed address', async () => {
    const onCheck = renderForm();

    await fillField('Email address', 'asha@');
    await press('Check');

    expect(
      await screen.findByText('Enter a valid email address, e.g. name@company.com'),
    ).toBeInTheDocument();
    expect(onCheck).not.toHaveBeenCalled();
  });

  it('rejects an address longer than 254 characters', async () => {
    const onCheck = renderForm();

    // Pasted in one go: typing 259 characters key by key is slow and proves nothing more.
    fireEvent.change(screen.getByLabelText(/^Email address\s*\*?$/), {
      target: { value: `${'a'.repeat(250)}@acme.com` },
    });
    await press('Check');

    expect(
      await screen.findByText('An email address is at most 254 characters'),
    ).toBeInTheDocument();
    expect(onCheck).not.toHaveBeenCalled();
  });

  it('checks the trimmed address', async () => {
    const onCheck = renderForm();

    await fillField('Email address', '  asha@acme.com  ');
    await press('Check');

    await waitFor(() => expect(onCheck).toHaveBeenCalledWith('asha@acme.com'));
  });

  it('is locked while a check is running', () => {
    renderForm(true);

    expect(screen.getByRole('button', { name: 'Checking…' })).toBeDisabled();
  });
});
