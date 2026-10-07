import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { ProblemCategory, ProblemSeverity } from '@exyconn/shell/graphql/generated';
import { ReportProblemForm } from '../../../../src/pages/report/forms/report-problem';
import { renderWithProviders } from '../../test-utils';
import { fill, findSnackbar, pickOption } from '../../form-helpers';
import { REFERENCE, reportInput, submitted } from './report.fixtures';

const SERVICES = [{ value: 'hr', label: 'HR Portal' }];

function renderForm(mocks: MockLink.MockedResponse[] = []) {
  const onSubmitted = vi.fn<(reference: string) => void>();
  const onCancel = vi.fn<() => void>();
  renderWithProviders(
    <ReportProblemForm services={SERVICES} onSubmitted={onSubmitted} onCancel={onCancel} />,
    { mocks },
  );
  return { onSubmitted, onCancel };
}

function fillReport(values = reportInput) {
  fill('Title', values.subject);
  fill('What happened?', values.description);
  fill('Your name', values.reporterName);
  fill('Your email', values.reporterEmail);
  fill('Page address (optional)', values.pageUrl);
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Send report' }));

describe('ReportProblemForm', () => {
  it('names every missing answer before anything is sent', async () => {
    const { onSubmitted } = renderForm();
    await submit();

    expect(
      await screen.findByText('Give the problem a short title (at least 5 characters)'),
    ).toBeInTheDocument();
    expect(screen.getByText('Tell us what happened — at least 20 characters')).toBeInTheDocument();
    expect(screen.getByText('Your name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('asks for a full web address when one is given', async () => {
    renderForm();
    fillReport({ ...reportInput, pageUrl: 'hr.exyconn.com/payslips' });
    await submit();
    expect(
      await screen.findByText('Enter the full address, starting with http'),
    ).toBeInTheDocument();
  });

  it('sends the service, kind, severity and page, then clears itself and hands back the reference', async () => {
    const input = {
      ...reportInput,
      serviceKey: 'hr',
      category: ProblemCategory.Slowness,
      severity: ProblemSeverity.High,
      pageUrl: 'https://hr.exyconn.com/payslips',
    };
    const { onSubmitted } = renderForm([submitted(input)]);
    await pickOption(/Which service/, 'HR Portal');
    await pickOption(/What kind of problem/, 'Slowness');
    await pickOption(/How badly is it blocking you/, 'High');
    fillReport(input);
    await submit();

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(REFERENCE));
    expect(screen.getByLabelText('Title')).toHaveValue('');
  });

  it('keeps the report and says why when it cannot be sent', async () => {
    const { onSubmitted } = renderForm([submitted(reportInput, new Error('Service unavailable'))]);
    fillReport();
    await submit();

    expect(await findSnackbar('Service unavailable')).toBeInTheDocument();
    expect(onSubmitted).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Title')).toHaveValue(reportInput.subject);
  });

  it('cancels on request', async () => {
    const { onCancel } = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
