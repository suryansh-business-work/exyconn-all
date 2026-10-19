import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, type Mock } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { appUrl } from '@exyconn/shell/config/apps';
import { renderWithProviders } from '../../test-utils';
import { notify, resetHarness } from './panel.harness';

/** What makes the Gmail and Microsoft Mail connection boxes different. */
export interface MailConnectionSpec {
  name: string;
  /** Renders the box with this many connected mailboxes. */
  render: (accountCount: number) => ReactElement;
  /** The test mutation function and the key its answer sits under. */
  mutation: Mock;
  resultKey: string;
  logger: { warn: Mock };
  connected: string;
  none: string;
  manageLabel: string;
  crmPath: string;
  /** The toast when the test passes without a detail, and when it fails without a message. */
  fallbackSuccess: string;
  fallbackFailure: string;
  /** What the logger is told when the test fails, and when even the toast fails. */
  failureLog: string;
  crashLog: string;
}

/** The behaviour the CRM mail connection boxes share. */
export function describeMailConnection(spec: Readonly<MailConnectionSpec>) {
  const pressTest = () => userEvent.click(screen.getByRole('button', { name: 'Test' }));

  describe(spec.name, () => {
    beforeEach(() => {
      resetHarness();
      spec.mutation.mockReset();
      spec.logger.warn.mockReset();
    });

    it('says nothing is connected yet and has nothing to test', () => {
      renderWithProviders(spec.render(0));
      expect(screen.getByText(spec.none)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Test' })).toBeDisabled();
    });

    it('counts the connected mailboxes and links to the CRM page that manages them', () => {
      renderWithProviders(spec.render(3));
      expect(screen.getByText(spec.connected)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: spec.manageLabel })).toHaveAttribute(
        'href',
        appUrl('crm', spec.crmPath),
      );
      expect(screen.getByRole('button', { name: 'Test' })).toBeEnabled();
    });

    it('reports what the test found', async () => {
      spec.mutation.mockResolvedValue({ data: { [spec.resultKey]: 'Read 3 mailboxes' } });
      renderWithProviders(spec.render(3));
      await pressTest();
      await waitFor(() => expect(notify).toHaveBeenCalledWith('Read 3 mailboxes', 'success'));
    });

    it('says the provider answered when the test gives no detail', async () => {
      spec.mutation.mockResolvedValue({});
      renderWithProviders(spec.render(1));
      await pressTest();
      await waitFor(() => expect(notify).toHaveBeenCalledWith(spec.fallbackSuccess, 'success'));
    });

    it('reports and logs why the test failed', async () => {
      const failure = new Error('A mailbox refused the token');
      spec.mutation.mockRejectedValue(failure);
      renderWithProviders(spec.render(1));
      await pressTest();
      await waitFor(() =>
        expect(notify).toHaveBeenCalledWith('A mailbox refused the token', 'error'),
      );
      expect(spec.logger.warn).toHaveBeenCalledWith(spec.failureLog, failure);
    });

    it('falls back to a plain failure when the error carries no message', async () => {
      spec.mutation.mockRejectedValue('offline');
      renderWithProviders(spec.render(1));
      await pressTest();
      await waitFor(() => expect(notify).toHaveBeenCalledWith(spec.fallbackFailure, 'error'));
    });

    it('logs instead of crashing when even the failure toast cannot be shown', async () => {
      const toastError = new Error('No snackbar');
      notify.mockImplementation(() => {
        throw toastError;
      });
      spec.mutation.mockRejectedValue(new Error('down'));
      renderWithProviders(spec.render(1));
      await pressTest();
      await waitFor(() => expect(spec.logger.warn).toHaveBeenCalledWith(spec.crashLog, toastError));
    });
  });
}
