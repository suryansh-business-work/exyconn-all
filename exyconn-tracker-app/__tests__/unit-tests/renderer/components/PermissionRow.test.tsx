// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import VideocamOutlined from '@mui/icons-material/VideocamOutlined';
import PermissionRow from '../../../../src/renderer/components/PermissionRow';
import { button, clickElement, render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

function row(busy: boolean, loading: boolean, onGrant = vi.fn()) {
  return (
    <PermissionRow
      title="Camera"
      reason="Takes the optional webcam photo."
      icon={VideocamOutlined}
      busy={busy}
      loading={loading}
      onGrant={onGrant}
    />
  );
}

describe('PermissionRow', () => {
  it('says what the grant is for and asks for it on Grant', async () => {
    const onGrant = vi.fn();
    await render(row(false, false, onGrant));
    expect(document.querySelector('h2')?.textContent).toBe('Camera');
    expect(pageText()).toContain('Takes the optional webcam photo.');
    await clickElement(button('Grant'));
    expect(onGrant).toHaveBeenCalledTimes(1);
  });

  it('waits while another request is in flight', async () => {
    await render(row(true, false));
    expect(button('Grant').disabled).toBe(true);
    expect(button('Grant').className).not.toContain('MuiButton-loading');
  });

  it('spins while this grant is being asked for', async () => {
    await render(row(false, true));
    expect(button('Grant').className).toContain('MuiButton-loading');
  });
});
