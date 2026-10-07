import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

interface SwitcherProps {
  roles: unknown;
  open: boolean;
  onClose: () => void;
}

const switcher = vi.hoisted(() => vi.fn());
vi.mock('@exyconn/shell/layout/PortalSwitcher', () => ({
  PortalSwitcher: (props: Readonly<SwitcherProps>) => {
    switcher(props);
    return props.open ? (
      <button type="button" onClick={props.onClose}>
        close switcher
      </button>
    ) : null;
  },
}));

const { OtherPortalsLink } = await import('../../../src/Login/OtherPortalsLink');

describe('OtherPortalsLink', () => {
  beforeEach(() => {
    switcher.mockClear();
  });

  it('starts with the switcher closed and lists every portal (no roles signed out)', () => {
    render(<OtherPortalsLink accentColor="#1a237e" />);
    expect(screen.getByRole('button', { name: 'Other Portals' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'close switcher' })).toBeNull();
    expect(switcher).toHaveBeenLastCalledWith(
      expect.objectContaining({ roles: null, open: false }),
    );
  });

  it('opens the switcher and closes it again', async () => {
    const user = userEvent.setup();
    render(<OtherPortalsLink accentColor="#1a237e" />);
    await user.click(screen.getByRole('button', { name: 'Other Portals' }));
    expect(switcher).toHaveBeenLastCalledWith(expect.objectContaining({ open: true }));
    await user.click(screen.getByRole('button', { name: 'close switcher' }));
    expect(screen.queryByRole('button', { name: 'close switcher' })).toBeNull();
    expect(switcher).toHaveBeenLastCalledWith(expect.objectContaining({ open: false }));
  });
});
