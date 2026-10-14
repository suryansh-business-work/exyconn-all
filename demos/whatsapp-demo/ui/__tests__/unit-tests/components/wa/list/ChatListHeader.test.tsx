import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ChatListHeader } from '../../../../../src/components/wa/list/ChatListHeader';
import { WA_LIGHT } from '../../../../../src/theme/wa.tokens';
import { renderWithProviders } from '../../../test-utils';

const view = vi.hoisted(() => ({ compact: false }));

vi.mock('../../../../../src/theme/useWa', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCompact: () => view.compact,
}));
vi.mock('@exyconn/shell/auth/AuthContext', () => ({
  useAuth: () => ({ user: null, signOut: vi.fn() }),
}));

afterEach(() => {
  view.compact = false;
});

describe('ChatListHeader', () => {
  it("shows the viewer's initials, the Chats title and the menu", () => {
    renderWithProviders(<ChatListHeader userName="Asha Rao Kumar" />);
    expect(screen.getByText('AR')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Chats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });

  it('sits on the panel header colour on a wide screen', () => {
    renderWithProviders(<ChatListHeader userName="Asha" />);
    expect(screen.getByRole('banner')).toHaveStyle({ backgroundColor: WA_LIGHT.panelHeader });
  });

  it('becomes the brand bar on a phone', () => {
    view.compact = true;
    renderWithProviders(<ChatListHeader userName="Asha" />);
    expect(screen.getByRole('banner')).toHaveStyle({ backgroundColor: WA_LIGHT.brandBar });
    expect(screen.getByRole('heading', { name: 'Chats' })).toHaveStyle({ fontWeight: '600' });
  });
});
