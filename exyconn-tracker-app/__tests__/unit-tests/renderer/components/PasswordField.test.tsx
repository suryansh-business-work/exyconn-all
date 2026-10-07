// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import PasswordField from '../../../../src/renderer/components/PasswordField';
import { button, clickElement, render, typeInto, unmountAll } from '../../test-utils';

afterEach(unmountAll);

function input(): HTMLInputElement {
  const field = document.querySelector('input');
  if (field === null) {
    throw new Error('No password input');
  }
  return field;
}

describe('PasswordField', () => {
  it('hides the password until the eye is pressed, and hides it again on a second press', async () => {
    await render(<PasswordField value="" disabled={false} error={false} onChange={vi.fn()} />);
    expect(input().type).toBe('password');
    expect(input().getAttribute('autocomplete')).toBe('current-password');

    await clickElement(button('Show password'));
    expect(input().type).toBe('text');
    await clickElement(button('Hide password'));
    expect(input().type).toBe('password');
  });

  it('hands every keystroke up', async () => {
    const onChange = vi.fn();
    await render(<PasswordField value="" disabled={false} error={false} onChange={onChange} />);
    await typeInto(input(), 'abc');
    expect(onChange).toHaveBeenCalledWith('abc');
  });

  it('marks the field invalid and says why', async () => {
    await render(
      <PasswordField
        value=""
        disabled
        error
        helperText="Enter your password."
        onChange={vi.fn()}
      />,
    );
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().disabled).toBe(true);
    expect(document.querySelector('.MuiFormHelperText-root')?.textContent).toBe(
      'Enter your password.',
    );
  });
});
