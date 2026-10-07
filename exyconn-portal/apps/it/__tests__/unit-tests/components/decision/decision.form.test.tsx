import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ItDecision } from '@exyconn/shell/graphql/generated';
import { DecisionForm } from '../../../../src/components/decision';
import { fill, pickOption, press, toast } from '../../core/form.helpers';
import { renderWithProviders } from '../../test-utils';

const onDecide = vi.fn();
const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = () =>
  renderWithProviders(<DecisionForm onDecide={onDecide} onDone={onDone} onCancel={onCancel} />);

describe('DecisionForm', () => {
  beforeEach(() => {
    onDecide.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('approves without a note and says so', async () => {
    renderForm();
    await press('Record decision');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onDecide).toHaveBeenCalledWith({ decision: ItDecision.Approved, note: '' });
    expect(await toast()).toHaveTextContent('Approved');
  });

  it('will not reject without saying why', async () => {
    renderForm();
    await pickOption(/^Decision/, 'Rejected');
    await press('Record decision');

    expect(await screen.findByText('Say why it is being rejected')).toBeInTheDocument();
    expect(onDecide).not.toHaveBeenCalled();
  });

  it('rejects with the trimmed reason and says so', async () => {
    renderForm();
    await pickOption(/^Decision/, 'Rejected');
    fill('Note', '  Not needed for this role  ');
    await press('Record decision');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onDecide).toHaveBeenCalledWith({
      decision: ItDecision.Rejected,
      note: 'Not needed for this role',
    });
    expect(await toast()).toHaveTextContent('Rejected');
  });

  it('caps the note at 500 characters', async () => {
    renderForm();
    fill('Note', 'x'.repeat(501));
    await press('Record decision');

    expect(await screen.findByText('Keep the note under 500 characters')).toBeInTheDocument();
    expect(onDecide).not.toHaveBeenCalled();
  });

  it('stays open and shows the server message when recording fails', async () => {
    onDecide.mockRejectedValue(new Error('Already decided by someone else'));
    renderForm();
    await press('Record decision');

    expect(await toast()).toHaveTextContent('Already decided by someone else');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    onDecide.mockRejectedValue('offline');
    renderForm();
    await press('Record decision');

    expect(await toast()).toHaveTextContent('Could not record the decision');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
