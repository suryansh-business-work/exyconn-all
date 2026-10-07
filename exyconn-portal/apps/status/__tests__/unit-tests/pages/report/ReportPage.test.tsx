import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { ReportPage } from '../../../../src/pages/report';
import { renderWithProviders } from '../../test-utils';
import { CurrentUrl, currentUrl, fill, pickOption } from '../../form-helpers';
import { overview, overviewMock } from '../status/status.fixtures';
import { REFERENCE, reportInput, submitted } from './report.fixtures';

function renderReport(mocks: MockLink.MockedResponse[]) {
  renderWithProviders(
    <>
      <ReportPage />
      <CurrentUrl />
    </>,
    { mocks, route: '/report' },
  );
  return Array.from(document.querySelectorAll('form'));
}

async function fileReport(form: HTMLElement) {
  fill('Title', reportInput.subject, form);
  fill('What happened?', reportInput.description, form);
  fill('Your name', reportInput.reporterName, form);
  fill('Your email', reportInput.reporterEmail, form);
  await userEvent.click(within(form).getByRole('button', { name: 'Send report' }));
}

describe('ReportPage', () => {
  it('lets the reporter pick only a monitored service, then shows the receipt', async () => {
    const [reportForm] = renderReport([
      overviewMock(1, overview()),
      submitted({ ...reportInput, serviceKey: 'hr' }),
    ]);
    expect(screen.getByRole('heading', { name: 'Report a problem' })).toBeInTheDocument();
    await pickOption(/Which service/, 'HR Portal');
    await fileReport(reportForm);

    expect(
      await screen.findByText('Thank you — your report is with our tech team'),
    ).toBeInTheDocument();
    expect(screen.getByText(REFERENCE)).toBeInTheDocument();
  });

  it('offers only "the whole platform" when the service list cannot be read', async () => {
    renderReport([]);
    await userEvent.click(screen.getByRole('combobox', { name: /Which service/ }));
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Not sure / the whole platform']);
  });

  it('files another report from the receipt, or goes back to the status page', async () => {
    const [reportForm] = renderReport([submitted(), submitted()]);
    await fileReport(reportForm);
    await userEvent.click(await screen.findByRole('button', { name: 'Report another problem' }));
    expect(screen.getByText('Check a report')).toBeInTheDocument();

    await fileReport(document.querySelectorAll('form')[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Back to status' }));
    expect(currentUrl()).toBe('/');
  });

  it.each([
    ['report', 0],
    ['check', 1],
  ])('leaves for the status page from the %s form’s Cancel', async (_form, index) => {
    const forms = renderReport([]);
    expect(currentUrl()).toBe('/report');
    await userEvent.click(within(forms[index]).getByRole('button', { name: 'Cancel' }));
    expect(currentUrl()).toBe('/');
  });
});
