import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoProfileForm } from '../../../../../src/admin/workflows/forms/demo-profile';
import type { DemoRow } from '../../../../../src/admin/workflows/model/api';
import { renderWithProviders } from '../../../test-utils';
import { demoRow } from './demo-profile.fixtures';

const api = vi.hoisted(() => ({ upsert: vi.fn(), options: undefined as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useUpsertWhatsappDemoMutation: (options: unknown) => {
    api.options = options;
    return [api.upsert];
  },
}));

function mount(demo: DemoRow | null = null) {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(<DemoProfileForm demo={demo} onSaved={onSaved} onCancel={onCancel} />);
  return { user, onSaved, onCancel };
}

const textbox = (name: string) => screen.getByRole('textbox', { name });

afterEach(() => {
  vi.restoreAllMocks();
  api.upsert.mockReset();
});

describe('DemoProfileForm', () => {
  it('creates a demo from a valid starting profile', async () => {
    api.upsert.mockResolvedValue({
      data: { upsertWhatsappDemo: demoRow({ id: 'demo-9', key: 'retail' }) },
    });
    const { user, onSaved } = mount();
    expect(textbox('Greeting')).toHaveValue('Hi {{user.firstName}}, welcome.');
    expect(screen.getByRole('switch', { name: 'Verified business badge' })).toBeChecked();
    expect(screen.getByRole('combobox', { name: 'Icon' })).toHaveTextContent('business');
    await user.type(textbox('Key'), 'retail');
    await user.type(textbox('Industry'), 'Retail');
    await user.type(textbox('Business name'), 'Kumar Stores');
    await user.type(textbox('Category'), 'Grocery');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('demo-9'));
    const { variables } = api.upsert.mock.calls[0][0];
    expect(variables.id).toBeNull();
    expect(variables.input).toMatchObject({
      key: 'retail',
      industry: 'Retail',
      menuButton: 'View options',
      order: 0,
      active: true,
      business: { name: 'Kumar Stores', category: 'Grocery', icon: 'business', accent: 'teal' },
    });
    expect(api.options).toEqual({ refetchQueries: ['WhatsappDemos', 'WhatsappDemoCatalog'] });
    expect(await screen.findByText('Demo saved')).toBeInTheDocument();
  });

  it('blocks a profile with contact details that do not look real', async () => {
    const { user, onSaved } = mount();
    expect(screen.getByText('e.g. retail')).toBeInTheDocument();
    await user.type(textbox('Phone'), 'call us');
    await user.type(textbox('Email'), 'desk');
    await user.type(textbox('Website'), 'shop');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Enter a valid phone number')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid URL')).toBeInTheDocument();
    expect(screen.getByText('Key is required')).toBeInTheDocument();
    expect(api.upsert).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('updates an existing demo, whose key is fixed', async () => {
    const demo = demoRow();
    api.upsert.mockResolvedValue({ data: { upsertWhatsappDemo: { ...demo, industry: 'Health' } } });
    const { user, onSaved, onCancel } = mount(demo);
    expect(textbox('Key')).toBeDisabled();
    expect(
      screen.getByText('Fixed once created: it is the demo’s web address'),
    ).toBeInTheDocument();
    expect(textbox('Business name')).toHaveValue('City Clinic');
    await user.clear(textbox('Industry'));
    await user.type(textbox('Industry'), 'Health');
    await user.click(screen.getByRole('switch', { name: 'Shown in the chat app' }));
    await user.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('demo-1'));
    expect(api.upsert.mock.calls[0][0].variables).toMatchObject({
      id: 'demo-1',
      input: { key: 'clinic', industry: 'Health', active: false, order: 1 },
    });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does nothing more when the server returns no demo', async () => {
    api.upsert.mockResolvedValue({ data: null });
    const { user, onSaved } = mount(demoRow());
    await user.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(api.upsert).toHaveBeenCalledTimes(1));
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.queryByText('Demo saved')).toBeNull();
  });

  it("shows the server's error and logs it", async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('Key already taken');
    api.upsert.mockRejectedValue(failure);
    const { user, onSaved } = mount(demoRow());
    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(await screen.findByText('Key already taken')).toBeInTheDocument();
    expect(log).toHaveBeenCalledWith('Could not save the demo', failure);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('falls back to a plain message for an unknown failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    api.upsert.mockRejectedValue('offline');
    const { user } = mount(demoRow());
    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(await screen.findByText('Could not save the demo')).toBeInTheDocument();
  });
});
