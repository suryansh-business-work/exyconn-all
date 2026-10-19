import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { WorkflowForm, type WorkflowFormValues } from '../../../../../src/pages/workflows/forms/workflow';
import { renderWithProviders } from '../../../test-utils';
import { fill, press } from '../../../helpers/form-helpers';

const onSubmit = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: WorkflowFormValues | null = null) =>
  renderWithProviders(<WorkflowForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />);

describe('WorkflowForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onSubmit.mockResolvedValue(undefined);
  });

  it('wants a name before it creates anything', async () => {
    renderForm();

    await press('Create workflow');

    expect(await screen.findByText('Give the workflow a name')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not take a name of only spaces', async () => {
    renderForm();
    fill('Name', '   ');

    await press('Create workflow');

    expect(await screen.findByText('Give the workflow a name')).toBeInTheDocument();
  });

  it('keeps the name and description within the server limits', async () => {
    renderForm();
    fill('Name', 'n'.repeat(121));
    fill('Description', 'd'.repeat(1001));

    await press('Create workflow');

    expect(await screen.findByText('Keep the name under 120 characters')).toBeInTheDocument();
    expect(screen.getByText('Keep the description under 1000 characters')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('accepts a name at the limit and sends the details trimmed', async () => {
    renderForm();
    fill('Name', ` ${'n'.repeat(120)} `);
    fill('Description', '  For bugs  ');

    await press('Create workflow');

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ name: 'n'.repeat(120), description: 'For bugs' }),
    );
  });

  it('edits an existing workflow under its own wording', async () => {
    renderForm({ name: 'Bug triage', description: '' });

    expect(screen.getByLabelText('Name')).toHaveValue('Bug triage');
    await press('Save details');
    await press('Cancel');

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ name: 'Bug triage', description: '' }),
    );
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
