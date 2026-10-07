// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import SelectSpinner from '../../../../src/renderer/components/SelectSpinner';
import { render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

describe('SelectSpinner', () => {
  it('stands in for the select arrow, hidden from screen readers, keeping the slot’s class', async () => {
    await render(<SelectSpinner className="MuiSelect-icon" />);
    const spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner?.getAttribute('aria-hidden')).toBe('true');
    expect(spinner?.classList.contains('MuiSelect-icon')).toBe(true);
  });
});
