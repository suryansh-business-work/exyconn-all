import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  AiInstructionForm,
  DEFAULT_AI_INSTRUCTION,
} from '../../../../../../src/pages/website-scraper/forms/ai-instruction';
import { renderWithProviders } from '../../../../test-utils';
import { fillField, press } from '../../../../form-helpers';

const LABEL = 'Instruction for the AI';

function renderForm({ initialInstruction = '', busy = false } = {}) {
  const onSubmit = vi.fn();
  renderWithProviders(
    <AiInstructionForm initialInstruction={initialInstruction} busy={busy} onSubmit={onSubmit} />,
  );
  return onSubmit;
}

describe('AiInstructionForm', () => {
  it('starts from the default instruction for a page never sent to the AI', async () => {
    const onSubmit = renderForm();

    expect(screen.getByLabelText(LABEL)).toHaveValue(DEFAULT_AI_INSTRUCTION);
    await press('Send to AI');
    expect(onSubmit).toHaveBeenCalledWith(DEFAULT_AI_INSTRUCTION);
  });

  it('starts from the last instruction sent for this page', () => {
    renderForm({ initialInstruction: 'List their prices' });

    expect(screen.getByLabelText(LABEL)).toHaveValue('List their prices');
  });

  it('wants at least 3 characters', async () => {
    const onSubmit = renderForm();

    await fillField(LABEL, 'ab');
    await press('Send to AI');

    expect(await screen.findByText('Write at least 3 characters')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('allows at most 1,000 characters', async () => {
    const onSubmit = renderForm({ initialInstruction: 'a'.repeat(1001) });

    await press('Send to AI');

    expect(await screen.findByText('At most 1,000 characters')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sends the trimmed instruction', async () => {
    const onSubmit = renderForm();

    await fillField(LABEL, '  Who runs it?  ');
    await press('Send to AI');

    expect(onSubmit).toHaveBeenCalledWith('Who runs it?');
  });

  it('is locked while the AI step is working', () => {
    renderForm({ busy: true });

    expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
    expect(screen.getByLabelText(LABEL)).toBeDisabled();
  });
});
