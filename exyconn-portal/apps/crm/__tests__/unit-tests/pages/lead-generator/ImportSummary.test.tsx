import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportSummary } from '../../../../src/pages/lead-generator/ImportSummary';
import { renderWithProviders } from '../../test-utils';
import { importResult } from './lead-fixtures';

const extra = (field: string, label: string, incoming: string) => ({
  field,
  label,
  current: '',
  incoming,
});

describe('ImportSummary', () => {
  it('reports a success with the counts, links each updated company and lists what it gained', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <ImportSummary
        onClose={onClose}
        summary={importResult({
          created: 2,
          merged: 1,
          merges: [
            {
              placeId: 'b',
              companyId: 'c-b',
              name: 'Beta Dental',
              added: [
                extra('emails', 'Email', 'a@beta.example'),
                extra('emails', 'Email', 'b@beta.example'),
                extra('website', 'Website', 'https://beta.example'),
              ],
            },
          ],
        })}
      />,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-colorSuccess');
    expect(alert).toHaveTextContent('2 companies added to the CRM, 1 updated, 0 skipped.');
    expect(screen.getByRole('link', { name: 'Beta Dental' })).toHaveAttribute(
      'href',
      '/companies/c-b',
    );
    expect(screen.getByText(': added Email, Website')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View companies' })).toHaveAttribute(
      'href',
      '/companies',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('reports only skips as information, linking the skipped businesses already in the CRM', () => {
    renderWithProviders(
      <ImportSummary
        onClose={vi.fn()}
        summary={importResult({
          skipped: 2,
          skips: [
            { placeId: 'a', name: 'Alpha Dental', reason: 'Already in the CRM', companyId: 'c-a' },
            { placeId: 'z', name: 'Zeta Clinic', reason: 'No name or website', companyId: null },
          ],
        })}
      />,
    );

    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorInfo');
    expect(screen.getByRole('link', { name: 'Alpha Dental' })).toHaveAttribute(
      'href',
      '/companies/c-a',
    );
    expect(screen.getByText(': Already in the CRM')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Zeta Clinic' })).not.toBeInTheDocument();
    expect(screen.getByText(/Zeta Clinic/)).toHaveTextContent('Zeta Clinic: No name or website');
  });

  it('names each lead saved without its website, and why', () => {
    renderWithProviders(
      <ImportSummary
        onClose={vi.fn()}
        summary={importResult({
          created: 1,
          websitesDropped: [
            {
              placeId: 'd',
              name: 'Delta Dental',
              website: 'https://delta.example',
              reason: 'Answered 404 instead of 200 OK',
            },
          ],
        })}
      />,
    );

    expect(
      screen.getByText(
        'Delta Dental: website https://delta.example not saved — Answered 404 instead of 200 OK',
      ),
    ).toBeInTheDocument();
  });
});
