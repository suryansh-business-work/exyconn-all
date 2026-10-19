import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateCompanyPanel } from '../../../../src/records/quick-create/CreateCompanyPanel';
import { CreateContactPanel } from '../../../../src/records/quick-create/CreateContactPanel';

interface StubFormProps {
  initial: null;
  onCreated: (row: { id: string; name: string }) => void;
  onDone: () => void;
  onCancel: () => void;
}

/** A create form reduced to its callbacks: save (create then done), close without saving, cancel. */
function StubForm({ initial, onCreated, onDone, onCancel }: Readonly<StubFormProps>) {
  return (
    <div data-initial={String(initial)}>
      <button
        type="button"
        onClick={() => {
          onCreated({ id: 'new-1', name: 'Globex' });
          onDone();
        }}
      >
        Save
      </button>
      <button type="button" onClick={onDone}>
        Done
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

vi.mock('../../../../src/pages/companies/forms/company', () => ({ CompanyForm: StubForm }));
vi.mock('../../../../src/pages/contacts/forms/contact', () => ({ ContactForm: StubForm }));

const PANELS = [
  ['CreateCompanyPanel', CreateCompanyPanel],
  ['CreateContactPanel', CreateContactPanel],
] as const;

describe.each(PANELS)('%s', (_name, Panel) => {
  const done = vi.fn();
  const cancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hands back the record the form created', async () => {
    render(<Panel done={done} cancel={cancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(done).toHaveBeenCalledWith({ id: 'new-1', name: 'Globex' });
    expect(cancel).not.toHaveBeenCalled();
  });

  it('cancels when the form closes without creating anything', async () => {
    render(<Panel done={done} cancel={cancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(done).not.toHaveBeenCalled();
  });

  it('passes the form a blank record and its cancel', async () => {
    const { container } = render(<Panel done={done} cancel={cancel} />);
    expect(container.firstElementChild).toHaveAttribute('data-initial', 'null');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
