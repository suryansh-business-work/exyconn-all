import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatHeader } from '../../../../../src/components/wa/chat/ChatHeader';
import { WA_LIGHT } from '../../../../../src/theme/wa.tokens';
import { renderWithProviders } from '../../../test-utils';
import { demoProfile } from '../wa-ui.fixtures';

const view = vi.hoisted(() => ({ compact: false }));

vi.mock('../../../../../src/theme/useWa', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCompact: () => view.compact,
}));

afterEach(() => {
  view.compact = false;
});

function renderHeader(typing = false, verified = true) {
  const props = { onBack: vi.fn(), onInfo: vi.fn(), onClear: vi.fn() };
  renderWithProviders(
    <ChatHeader demo={demoProfile({}, { verified })} typing={typing} {...props} />,
  );
  return { ...props, user: userEvent.setup() };
}

describe('ChatHeader', () => {
  it('shows the business as online, with no back button on a wide screen', () => {
    renderHeader();
    expect(screen.getByText('City Clinic')).toBeInTheDocument();
    expect(screen.getByText('online')).toBeInTheDocument();
    expect(screen.getByTitle('Verified business')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to chats' })).not.toBeInTheDocument();
  });

  it('says typing… while the business is typing', () => {
    renderHeader(true, false);
    expect(screen.getByText('typing…')).toBeInTheDocument();
    expect(screen.queryByTitle('Verified business')).not.toBeInTheDocument();
  });

  it('opens the business info from the name', async () => {
    const { user, onInfo } = renderHeader();
    await user.click(screen.getByRole('button', { name: 'Business info: City Clinic' }));
    expect(onInfo).toHaveBeenCalledTimes(1);
  });

  it('offers business info and clearing the chat from its menu', async () => {
    const { user, onInfo, onClear } = renderHeader();
    await user.click(screen.getByRole('button', { name: 'Chat menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Business info' }));
    expect(onInfo).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Chat menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Clear chat' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('closes its menu on Escape without acting', async () => {
    const { user, onInfo, onClear } = renderHeader();
    await user.click(screen.getByRole('button', { name: 'Chat menu' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(onInfo).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });

  it('becomes the brand bar with a back button on a phone', async () => {
    view.compact = true;
    const { user, onBack } = renderHeader();
    expect(screen.getByRole('banner')).toHaveStyle({ backgroundColor: WA_LIGHT.brandBar });
    await user.click(screen.getByRole('button', { name: 'Back to chats' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
