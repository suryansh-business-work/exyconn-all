import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { accessibleModules } from '@exyconn/shell/config/modules';
import { Portal } from '../../../../src/pages/Portal/Portal';
import { makeUser, renderWithProviders } from '../../test-utils';

const navigateTo = vi.hoisted(() => vi.fn());

// The launcher only decides which module a card opens; whether that is a client-side route
// change or a full page load is the shell hook's job, so the hook is replaced by a spy.
vi.mock('@exyconn/shell/hooks/useCrossAppNavigate', () => ({
  useCrossAppNavigate: () => navigateTo,
}));

afterEach(() => {
  navigateTo.mockReset();
});

describe('Portal', () => {
  it('renders nothing while nobody is signed in', () => {
    const { container } = renderWithProviders(<Portal />, { user: null });
    expect(container).toBeEmptyDOMElement();
  });

  it('greets the person by first name and lists every module their role opens', () => {
    const user = makeUser({ name: 'Ravi Kumar Singh', roles: ['EMPLOYEE'] });
    const expected = accessibleModules(user.roles);
    renderWithProviders(<Portal />, { user });

    expect(screen.getByRole('heading', { name: /Hello, Ravi\b/ })).toBeInTheDocument();
    expect(screen.queryByText(/Kumar/)).not.toBeInTheDocument();
    expect(expected.length).toBeGreaterThan(1);
    expect(screen.getByText(`You have access to ${expected.length} modules.`)).toBeInTheDocument();
    for (const module of expected) {
      expect(screen.getByRole('heading', { name: module.label })).toBeInTheDocument();
      expect(screen.getByText(module.description)).toBeInTheDocument();
    }
  });

  it('uses the singular when the role opens exactly one module', () => {
    const user = makeUser({ roles: ['FINANCE'] });
    expect(accessibleModules(user.roles)).toHaveLength(1);
    renderWithProviders(<Portal />, { user });

    expect(screen.getByText('You have access to 1 module.')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('shows zero modules and no cards for a person without any role', () => {
    renderWithProviders(<Portal />, { user: makeUser({ roles: [] }) });

    expect(screen.getByText('You have access to 0 modules.')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('opens the module behind the clicked card at its landing path', async () => {
    const user = makeUser({ roles: ['FINANCE', 'HR'] });
    const [finance, hr] = accessibleModules(user.roles);
    renderWithProviders(<Portal />, { user });

    await userEvent.click(screen.getByRole('button', { name: new RegExp(hr.label) }));
    expect(navigateTo).toHaveBeenCalledTimes(1);
    expect(navigateTo).toHaveBeenCalledWith(hr.key, hr.path);

    await userEvent.click(screen.getByRole('button', { name: new RegExp(finance.label) }));
    expect(navigateTo).toHaveBeenLastCalledWith(finance.key, finance.path);
  });
});
