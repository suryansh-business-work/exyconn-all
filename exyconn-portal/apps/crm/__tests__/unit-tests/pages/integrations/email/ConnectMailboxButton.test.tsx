import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { ConnectMailboxButton } from '../../../../../src/pages/integrations/email/ConnectMailboxButton';
import { renderWithProviders } from '../../../test-utils';

const onConnect = vi.fn();
const HINT = 'Gmail is not switched on yet. Ask your platform administrator.';
const LOG = 'crm: email accounts cannot connect yet, the OAuth app is not set up';

function renderButton(available: boolean | undefined) {
  return renderWithProviders(
    <ConnectMailboxButton
      label="Connect Gmail account"
      available={available}
      unavailableHint={HINT}
      connecting={false}
      onConnect={onConnect}
      provider="GMAIL"
    />,
  );
}

const button = () => screen.getByRole('button', { name: 'Connect Gmail account' });

describe('ConnectMailboxButton', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    onConnect.mockReset();
    warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it('connects on click while the provider is available, logging nothing', async () => {
    renderButton(true);

    await userEvent.click(button());
    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it("does nothing and gives the caller's reason on focus, logged once however often it renders", async () => {
    const { rerender } = renderButton(false);
    rerender(
      <ConnectMailboxButton
        label="Connect Gmail account"
        available={false}
        unavailableHint={HINT}
        connecting={false}
        onConnect={onConnect}
        provider="GMAIL"
      />,
    );

    expect(button()).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(button());
    expect(onConnect).not.toHaveBeenCalled();
    button().focus();
    expect(await screen.findByRole('tooltip', { name: HINT })).toBeInTheDocument();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(LOG, { provider: 'GMAIL' });
  });

  it('translates the reason it is given', async () => {
    renderWithProviders(
      <ConnectMailboxButton
        label="Connect Gmail account"
        available={false}
        unavailableHint={HINT}
        connecting={false}
        onConnect={onConnect}
        provider="GMAIL"
      />,
      { messages: { [HINT]: 'Gmail aún no está activado.' } },
    );

    await userEvent.hover(button());
    expect(
      await screen.findByRole('tooltip', { name: 'Gmail aún no está activado.' }),
    ).toBeInTheDocument();
  });

  it('waits quietly, off and without a reason, until availability is known', () => {
    renderButton(undefined);

    expect(button()).toBeDisabled();
    expect(warn).not.toHaveBeenCalled();
  });
});
