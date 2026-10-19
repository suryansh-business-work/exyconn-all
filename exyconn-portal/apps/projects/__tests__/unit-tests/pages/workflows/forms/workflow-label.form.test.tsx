import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { WorkflowLabelForm } from '../../../../../src/pages/workflows/forms/workflow-label';
import { renderWithProviders } from '../../../test-utils';
import { fill, press } from '../../../helpers/form-helpers';

const onSubmit = vi.fn();
const onCancel = vi.fn();

const renderForm = (target: 'step' | 'connection', initial = '') =>
  renderWithProviders(
    <WorkflowLabelForm target={target} initial={initial} onSubmit={onSubmit} onCancel={onCancel} />,
  );

describe('WorkflowLabelForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('insists every step has a name', async () => {
    renderForm('step', 'Review');
    expect(screen.getByText('What happens at this step')).toBeInTheDocument();
    fill('Step name', '  ');

    await press('Apply');

    expect(await screen.findByText('Every step needs a name')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('applies a step name trimmed, up to the limit', async () => {
    renderForm('step');
    fill('Step name', ` ${'s'.repeat(80)} `);

    await press('Apply');

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('s'.repeat(80)));
  });

  it('refuses a step name over 80 characters', async () => {
    renderForm('step');
    fill('Step name', 's'.repeat(81));

    await press('Apply');

    expect(await screen.findByText('Keep it under 80 characters')).toBeInTheDocument();
  });

  it('lets a connection go unlabelled', async () => {
    renderForm('connection', 'Yes');
    expect(screen.getByText('e.g. Yes, No, Approved')).toBeInTheDocument();
    fill('Connection label', '');

    await press('Apply');

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(''));
  });

  it('refuses a connection label over 80 characters, and cancels', async () => {
    renderForm('connection');
    fill('Connection label', 'c'.repeat(81));

    await press('Apply');
    expect(await screen.findByText('Keep it under 80 characters')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await press('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
