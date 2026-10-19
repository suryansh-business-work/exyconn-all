import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, type Mock } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils';
import { notify, resetHarness } from '../panel.harness';
import { expectMessages, fakeSecret, fill, press } from './form.helpers';

/** What makes one single-config OAuth client form (Gmail, Google sign-in, Microsoft) different. */
export interface OAuthClientFormSpec {
  name: string;
  /** Renders the form on a stored config with these overrides. */
  render: (overrides: Record<string, unknown>) => ReactElement;
  /** The save mutation function, as `useSaveXMutation` returns it. */
  save: Mock;
  logger: { warn: Mock };
  clientIdLabel: string;
  /** A client ID the form accepts, and the stored one the config starts with. */
  validClientId: string;
  storedClientId: string;
  switchLabel: string;
  /** Extra values the form sends beyond clientId, clientSecret and enabled. */
  extraInput: Record<string, unknown>;
  missingClientId: string;
  missingSecret: string;
  newSecretHint: string;
  saved: string;
  saveFailedLog: string;
  saveFailedFallback: string;
}

/** The behaviour the single-config OAuth client forms share. */
export function describeOAuthClientForm(spec: Readonly<OAuthClientFormSpec>) {
  describe(spec.name, () => {
    beforeEach(() => {
      resetHarness();
      spec.save.mockReset().mockResolvedValue({ data: {} });
      spec.logger.warn.mockReset();
    });

    it('starts from the stored client ID, with the secret blank and kept', () => {
      renderWithProviders(spec.render({}));
      expect(screen.getByLabelText(spec.clientIdLabel)).toHaveValue(spec.storedClientId);
      expect(screen.getByLabelText('Client secret')).toHaveValue('');
      expect(screen.getByLabelText(spec.switchLabel)).toBeChecked();
    });

    it('will not switch on without a client ID and a secret', async () => {
      renderWithProviders(spec.render({ clientId: '', hasClientSecret: false }));
      expect(screen.getByText(spec.newSecretHint)).toBeInTheDocument();
      await press('Save changes');
      await expectMessages(spec.missingClientId, spec.missingSecret);
      expect(spec.save).not.toHaveBeenCalled();
    });

    it('saves a switched-off client with nothing filled in', async () => {
      renderWithProviders(spec.render({ clientId: '', hasClientSecret: false, enabled: false }));
      await press('Save changes');
      await waitFor(() => expect(notify).toHaveBeenCalledWith(spec.saved, 'success'));
      expect(spec.save).toHaveBeenCalledWith({
        variables: {
          input: { clientId: '', clientSecret: '', enabled: false, ...spec.extraInput },
        },
      });
    });

    it('rejects values that are too long', async () => {
      renderWithProviders(spec.render({}));
      fill(spec.clientIdLabel, 'x'.repeat(301));
      fill('Client secret', 'y'.repeat(501));
      await press('Save changes');
      await expectMessages('That is too long for a client ID', 'That is too long for a client secret');
      expect(spec.save).not.toHaveBeenCalled();
    });

    it('saves a new secret, then clears the field so the stored one is kept', async () => {
      const secret = fakeSecret('cs-', 24);
      renderWithProviders(spec.render({}));
      fill(spec.clientIdLabel, spec.validClientId);
      fill('Client secret', secret);
      await press('Save changes');
      await waitFor(() => expect(notify).toHaveBeenCalledWith(spec.saved, 'success'));
      expect(spec.save).toHaveBeenCalledWith({
        variables: {
          input: { clientId: spec.validClientId, clientSecret: secret, enabled: true, ...spec.extraInput },
        },
      });
      expect(screen.getByLabelText('Client secret')).toHaveValue('');
      expect(screen.getByLabelText(spec.clientIdLabel)).toHaveValue(spec.validClientId);
    });

    it('reports and logs a failed save', async () => {
      const failure = new Error('Server refused the client');
      spec.save.mockRejectedValue(failure);
      renderWithProviders(spec.render({}));
      await press('Save changes');
      await waitFor(() => expect(notify).toHaveBeenCalledWith('Server refused the client', 'error'));
      expect(spec.logger.warn).toHaveBeenCalledWith(spec.saveFailedLog, failure);
    });

    it('falls back to a plain message when the failure carries none', async () => {
      spec.save.mockRejectedValue('offline');
      renderWithProviders(spec.render({}));
      await press('Save changes');
      await waitFor(() => expect(notify).toHaveBeenCalledWith(spec.saveFailedFallback, 'error'));
    });

    it('puts the stored values back on Cancel', async () => {
      renderWithProviders(spec.render({}));
      fill(spec.clientIdLabel, spec.validClientId);
      await userEvent.click(screen.getByLabelText(spec.switchLabel));
      await press('Cancel');
      expect(screen.getByLabelText(spec.clientIdLabel)).toHaveValue(spec.storedClientId);
      expect(screen.getByLabelText(spec.switchLabel)).toBeChecked();
    });
  });
}
