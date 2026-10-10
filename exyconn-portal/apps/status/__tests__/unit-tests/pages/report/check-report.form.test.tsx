import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { formatWith } from '@exyconn/shell/utils/date';
import { CheckReportForm } from '../../../../src/pages/report';
import { checkReportSchema } from '../../../../src/pages/report/forms/check-report';
import { TIME_FORMAT } from '../../../../src/status.constants';
import { renderWithProviders } from '../../test-utils';
import { fill, findSnackbar } from '../../form-helpers';
import { REFERENCE, refusedStatusLookup, reportStatus, statusLookup } from './report.fixtures';

function renderForm(mocks: MockLink.MockedResponse[] = []) {
  const onCancel = vi.fn<() => void>();
  renderWithProviders(<CheckReportForm onCancel={onCancel} />, { mocks });
  return { onCancel };
}

async function check(reference: string) {
  fill('Report reference', reference);
  await userEvent.click(screen.getByRole('button', { name: 'Check' }));
}

describe('checkReportSchema', () => {
  it('forgives case and spaces, and nothing else', () => {
    expect(checkReportSchema.parse({ reference: ' exy-4kq7w2 ' })).toEqual({
      reference: REFERENCE,
    });
    expect(checkReportSchema.safeParse({ reference: 'EXY-4KQ7W' }).success).toBe(false);
  });
});

describe('CheckReportForm', () => {
  it('rejects something that is not a reference', async () => {
    renderForm();
    await check('ticket 42');
    expect(await screen.findByText('A reference looks like EXY-4KQ7W2')).toBeInTheDocument();
  });

  it('shows the status of a known report', async () => {
    const status = reportStatus();
    renderForm([statusLookup(status)]);
    await check('exy-4kq7w2');

    expect(await screen.findByText(REFERENCE)).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(
      screen.getByText(`HR Portal · last updated ${formatWith(status.updatedAt, TIME_FORMAT)}`),
    ).toBeInTheDocument();
  });

  it('says "Whole platform" for a report not tied to one service', async () => {
    renderForm([statusLookup(reportStatus({ serviceName: '' }))]);
    await check(REFERENCE);
    expect(await screen.findByText(/^Whole platform · last updated/)).toBeInTheDocument();
  });

  it('drops an earlier answer when the server comes back with nothing', async () => {
    renderForm([statusLookup(reportStatus()), statusLookup(null)]);
    await check(REFERENCE);
    expect(await screen.findByText('IN PROGRESS')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Check' }));
    await waitFor(() => expect(screen.queryByText('IN PROGRESS')).not.toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clears the answer and says why when the lookup fails', async () => {
    renderForm([
      statusLookup(reportStatus()),
      statusLookup(new Error('No report matches that reference')),
    ]);
    await check(REFERENCE);
    expect(await screen.findByText('IN PROGRESS')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(await findSnackbar('No report matches that reference')).toBeInTheDocument();
    expect(screen.queryByText('IN PROGRESS')).not.toBeInTheDocument();
  });

  it('reports a GraphQL error the server answered with', async () => {
    renderForm([refusedStatusLookup('Lookup refused')]);
    await check(REFERENCE);
    expect(await findSnackbar('Lookup refused')).toBeInTheDocument();
  });

  it('cancels on request', async () => {
    const { onCancel } = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
