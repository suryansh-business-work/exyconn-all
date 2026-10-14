import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  WorkflowDetailsForm,
  type WorkflowDetailsValues,
} from '../../../../../src/admin/workflows/forms/workflow-details';
import { renderWithProviders } from '../../../test-utils';

const INITIAL: WorkflowDetailsValues = {
  key: '',
  name: '',
  description: '',
  keywords: [],
  order: 0,
};

function mount(initial: WorkflowDetailsValues = INITIAL, isEdit = false) {
  const onSubmit = vi.fn<(values: WorkflowDetailsValues) => void>();
  const onCancel = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(
    <WorkflowDetailsForm
      initial={initial}
      isEdit={isEdit}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />,
  );
  return { user, onSubmit, onCancel };
}

const textbox = (name: string) => screen.getByRole('textbox', { name });

describe('WorkflowDetailsForm', () => {
  it('creates a workflow with keywords and a menu position', async () => {
    const { user, onSubmit } = mount();
    expect(screen.getByText('e.g. book-appointment')).toBeInTheDocument();
    await user.type(textbox('Key'), 'book-appointment');
    await user.type(textbox('Name'), 'Book a visit');
    await user.type(textbox('Description'), 'Pick a day and a time');
    await user.type(screen.getByRole('combobox', { name: 'Keywords' }), 'book{Enter}visit{Enter}');
    const order = screen.getByRole('spinbutton', { name: 'Menu position' });
    await user.clear(order);
    await user.type(order, '2');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({
      key: 'book-appointment',
      name: 'Book a visit',
      description: 'Pick a day and a time',
      keywords: ['book', 'visit'],
      order: 2,
    });
  });

  it('explains every rule a person can break', async () => {
    const { user, onSubmit } = mount();
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Key is required')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    await user.type(textbox('Key'), 'Book Now');
    await user.type(textbox('Name'), 'A name far too long for a row');
    await user.type(textbox('Description'), 'x'.repeat(73));
    const order = screen.getByRole('spinbutton', { name: 'Menu position' });
    await user.clear(order);
    await user.type(order, '-1');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(
      await screen.findByText('Use lowercase letters, digits and hyphens only'),
    ).toBeInTheDocument();
    expect(screen.getByText('WhatsApp shows at most 24 characters')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp shows at most 72 characters')).toBeInTheDocument();
    expect(screen.getByText('Use 0 or more')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('caps keywords at 20', async () => {
    const keywords = Array.from({ length: 21 }, (_, i) => `k${i}`);
    const { user, onSubmit } = mount({ ...INITIAL, key: 'faq', name: 'FAQ', keywords });
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Use at most 20 keywords')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('fixes the key of an existing workflow and updates the rest', async () => {
    const initial = { key: 'faq', name: 'FAQ', description: '', keywords: ['help'], order: 1 };
    const { user, onSubmit, onCancel } = mount(initial, true);
    expect(textbox('Key')).toBeDisabled();
    expect(
      screen.getByText('Fixed once created: Jump nodes and analytics use it'),
    ).toBeInTheDocument();
    expect(screen.getByText('help')).toBeInTheDocument();
    expect(screen.getByText('3/24')).toBeInTheDocument();
    await user.type(textbox('Name'), 's');
    await user.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ ...initial, name: 'FAQs' });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
