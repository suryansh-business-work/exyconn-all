import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseFormReturn } from 'react-hook-form';
import { PersonalizeStep } from '../../../../../../../src/pages/marketing/forms/campaign/steps/PersonalizeStep';
import type { CampaignStudioValues } from '../../../../../../../src/pages/marketing/forms/campaign/campaign.types';
import { renderWithProviders } from '../../../../../test-utils';
import { StudioFormHarness } from '../form-harness';
import { COMPANY, previewState, studioOptions } from '../studio.fixtures';

const gql = vi.hoisted(() => ({ records: vi.fn() }));

vi.mock('@exyconn/code-editor', () => import('../code-editor-stub'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePreviewRecordOptionsQuery: () => gql.records(),
}));

function renderStep(values: Partial<CampaignStudioValues> = {}) {
  gql.records.mockReturnValue({ data: { previewRecordOptions: [COMPANY] }, loading: false });
  const onPreviewRecord = vi.fn();
  let form: UseFormReturn<CampaignStudioValues> | undefined;
  renderWithProviders(
    <StudioFormHarness
      values={{ subject: 'Hello', preheader: 'Inside', ...values }}
      onForm={(value) => {
        form = value;
      }}
    >
      <PersonalizeStep
        options={studioOptions()}
        preview={previewState()}
        previewRecord={null}
        onPreviewRecord={onPreviewRecord}
      />
    </StudioFormHarness>,
  );
  return { onPreviewRecord, form: () => form as UseFormReturn<CampaignStudioValues> };
}

describe('PersonalizeStep', () => {
  it('edits the subject and preview text', () => {
    const { form } = renderStep();
    expect(screen.getByLabelText('Email subject')).toHaveValue('Hello');
    fireEvent.change(screen.getByLabelText('Email subject'), { target: { value: 'Hi there' } });
    fireEvent.change(screen.getByLabelText('Preview text'), { target: { value: 'Offers' } });
    expect(form().getValues(['subject', 'preheader'])).toEqual(['Hi there', 'Offers']);
  });

  it('inserts a variable into the subject at the caret', async () => {
    const { form } = renderStep({ subject: 'Hi ' });
    const [subjectPicker] = screen.getAllByRole('combobox', { name: 'Insert variable' });
    screen.getByLabelText<HTMLInputElement>('Email subject').setSelectionRange(3, 3);
    await userEvent.click(subjectPicker);
    await userEvent.click(screen.getByRole('option', { name: /First name/ }));
    expect(form().getValues('subject')).toBe('Hi {{contact.firstName|there}}');
  });

  it('shows why an empty subject cannot be used', async () => {
    const { form } = renderStep({ subject: '' });
    expect(screen.queryByText('Add a subject line')).not.toBeInTheDocument();
    await act(() => form().trigger('subject'));
    expect(screen.getByText('Add a subject line')).toHaveAttribute('role', 'alert');
  });

  it('previews as a chosen CRM record', async () => {
    const { onPreviewRecord } = renderStep();
    await userEvent.click(screen.getByRole('combobox', { name: 'Preview as' }));
    await userEvent.click(screen.getByRole('option', { name: 'Acme' }));
    expect(onPreviewRecord).toHaveBeenCalledWith(COMPANY);
    expect(screen.getByTitle('Email preview')).toBeInTheDocument();
    expect(screen.getByText(/CRM values are always escaped/)).toBeInTheDocument();
  });
});
