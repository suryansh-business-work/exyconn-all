import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { ApplicantStage } from '@exyconn/shell/graphql/generated';
import {
  ApplicantStageForm,
  type StagedApplicant,
} from '../../../../../../src/pages/applicants/forms/applicant-stage';
import { renderWithProviders } from '../../../../test-utils';
import { chooseOption, press, typeInto } from '../../../../harness/forms';

vi.setConfig({ testTimeout: 20_000 });

const gql = vi.hoisted(() => ({ setStage: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSetApplicantStageMutation: () => [gql.setStage],
}));

const EMAILED = 'The applicant will be emailed about this stage.';

function renderForm(stage: ApplicantStage = ApplicantStage.Screening) {
  const applicant: StagedApplicant = { id: 'applicant-1', name: 'Asha Rao', stage };
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <ApplicantStageForm applicant={applicant} onDone={onDone} onCancel={onCancel} />,
  );
  return { onDone, onCancel };
}

describe('ApplicantStageForm', () => {
  beforeEach(() => {
    gql.setStage.mockReset().mockResolvedValue({});
  });

  it('says where the applicant is now, with no email warning for a quiet stage', () => {
    renderForm();

    expect(screen.getByText('Asha Rao · currently screening')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move' })).toBeInTheDocument();
    expect(screen.queryByText(EMAILED)).not.toBeInTheDocument();
  });

  it('warns before a move the applicant will be emailed about', async () => {
    renderForm();

    await chooseOption('Stage', 'Interview');

    expect(screen.getByText(EMAILED)).toBeInTheDocument();
  });

  it('warns straight away when the applicant already sits at an emailed stage', () => {
    renderForm(ApplicantStage.Offer);

    expect(screen.getByText(EMAILED)).toBeInTheDocument();
  });

  it('moves the applicant with a note for the history and reports it', async () => {
    const { onDone } = renderForm();

    await chooseOption('Stage', 'Interview');
    await typeInto('Note', '  Booked for Monday ');
    await press('Move');

    await waitFor(() =>
      expect(gql.setStage).toHaveBeenCalledWith({
        variables: {
          id: 'applicant-1',
          stage: ApplicantStage.Interview,
          note: 'Booked for Monday',
        },
      }),
    );
    expect(await screen.findByText('Asha Rao moved to interview')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('keeps the note under 2000 characters', async () => {
    renderForm();

    fireEvent.change(screen.getByRole('textbox', { name: 'Note' }), {
      target: { value: 'n'.repeat(2001) },
    });
    await press('Move');

    expect(await screen.findByText('Keep the note under 2000 characters')).toBeInTheDocument();
    expect(gql.setStage).not.toHaveBeenCalled();
  });

  it('says why the move failed and stays open', async () => {
    gql.setStage.mockRejectedValueOnce(new Error('Hired applicants cannot move back'));
    const { onDone } = renderForm(ApplicantStage.Hired);

    await press('Move');

    expect(await screen.findByText('Hired applicants cannot move back')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    gql.setStage.mockRejectedValueOnce('offline');
    renderForm();

    await press('Move');

    expect(await screen.findByText('Could not move the applicant')).toBeInTheDocument();
  });

  it('hands control back on cancel', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.setStage).not.toHaveBeenCalled();
  });
});
