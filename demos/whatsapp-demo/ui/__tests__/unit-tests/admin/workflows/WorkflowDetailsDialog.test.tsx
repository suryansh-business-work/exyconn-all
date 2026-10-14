import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowDetailsDialog } from '../../../../src/admin/workflows/WorkflowDetailsDialog';
import type {
  WorkflowDetailsFormProps,
  WorkflowDetailsValues,
} from '../../../../src/admin/workflows/forms/workflow-details';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../../src/admin/workflows/forms/workflow-details', () => ({
  WorkflowDetailsForm: ({
    initial,
    isEdit,
    onSubmit,
    onCancel,
  }: Readonly<WorkflowDetailsFormProps>) => (
    <div>
      <p>{`Details form for ${initial.key}${isEdit ? ' (edit)' : ''}`}</p>
      <button type="button" onClick={() => onSubmit({ ...initial, name: 'Renamed' })}>
        Submit details
      </button>
      <button type="button" onClick={onCancel}>
        Cancel details
      </button>
    </div>
  ),
}));

const INITIAL: WorkflowDetailsValues = {
  key: 'book-visit',
  name: 'Book a visit',
  description: '',
  keywords: [],
  order: 1,
};

function mount(open: boolean) {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  renderWithProviders(
    <WorkflowDetailsDialog
      open={open}
      title="Workflow details"
      initial={INITIAL}
      isEdit
      onSubmit={onSubmit}
      onClose={onClose}
    />,
    { messages: { 'Workflow details': 'Détails du workflow' } },
  );
  return { onSubmit, onClose };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WorkflowDetailsDialog', () => {
  it('renders nothing while closed', () => {
    mount(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/Details form/)).not.toBeInTheDocument();
  });

  it('puts the details form in a titled dialog and passes its answers on', async () => {
    const user = userEvent.setup();
    const { onSubmit, onClose } = mount(true);
    expect(screen.getByRole('dialog', { name: 'Détails du workflow' })).toBeInTheDocument();
    expect(screen.getByText('Details form for book-visit (edit)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit details' }));
    expect(onSubmit).toHaveBeenCalledWith({ ...INITIAL, name: 'Renamed' });
    await user.click(screen.getByRole('button', { name: 'Cancel details' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fills the screen on a phone', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    mount(true);
    expect(screen.getByRole('dialog')).toHaveClass('MuiDialog-paperFullScreen');
  });
});
