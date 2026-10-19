import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { propsOf, resetHarness } from './panel.harness';

/** What makes one single-config panel (Gmail, Microsoft Mail, Google sign-in) different. */
export interface SingletonPanelSpec {
  name: string;
  Panel: ComponentType;
  /** The panel's `useXConfigQuery` stand-in and the key its config sits under. */
  query: Mock;
  dataKey: string;
  /** A loaded config; the tests vary `updatedAt`. */
  config: Record<string, unknown>;
  logger: { warn: Mock };
  title: string;
  loadError: string;
  retryLog: string;
  /** The stand-in form's name and the redirect URI it must show. */
  form: string;
  redirectUri: string;
  /** Whether a load error still shows a config that was already loaded. */
  keepsLoadedConfigOnError: boolean;
}

/** The loading, failure and loaded states every single-config panel shares. */
export function describeSingletonPanel(spec: Readonly<SingletonPanelSpec>) {
  const refetch = vi.fn();
  const answer = (data: unknown, error?: Error) =>
    spec.query.mockReturnValue({ data, error, refetch });

  describe(spec.name, () => {
    beforeEach(() => {
      resetHarness();
      refetch.mockReset().mockResolvedValue({});
      spec.logger.warn.mockReset();
    });

    it('asks the server for the latest config while showing any cached one', () => {
      answer(undefined);
      renderWithProviders(<spec.Panel />);
      expect(spec.query).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    });

    it('holds the space with a busy placeholder until the config arrives', () => {
      answer(undefined);
      const { container } = renderWithProviders(<spec.Panel />);
      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: spec.title })).not.toBeInTheDocument();
    });

    it('says why it could not load, and retries on request', async () => {
      answer(undefined, new Error('Gateway timeout'));
      renderWithProviders(<spec.Panel />);
      expect(screen.getByText(new RegExp(`${spec.loadError} Gateway timeout`))).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
      expect(refetch).toHaveBeenCalledTimes(1);
      expect(spec.logger.warn).not.toHaveBeenCalled();
    });

    it('logs a retry that fails again', async () => {
      const retryError = new Error('still down');
      refetch.mockRejectedValue(retryError);
      answer(undefined, new Error('Gateway timeout'));
      renderWithProviders(<spec.Panel />);
      await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
      await waitFor(() => expect(spec.logger.warn).toHaveBeenCalledWith(spec.retryLog, retryError));
    });

    it('shows the config, the redirect URI to register and the form on it', () => {
      const config = { ...spec.config, updatedAt: '2026-10-01T10:00:00.000Z' };
      answer({ [spec.dataKey]: config });
      renderWithProviders(<spec.Panel />);
      expect(screen.getByRole('heading', { level: 2, name: spec.title })).toBeInTheDocument();
      expect(screen.getByText(spec.redirectUri)).toBeInTheDocument();
      expect(propsOf(spec.form).initial).toBe(config);
    });

    it('shows the form on a config that was never saved', () => {
      const config = { ...spec.config, updatedAt: null };
      answer({ [spec.dataKey]: config });
      renderWithProviders(<spec.Panel />);
      expect(propsOf(spec.form).initial).toBe(config);
    });

    if (spec.keepsLoadedConfigOnError) {
      it('keeps showing a loaded config when a background reload fails', () => {
        answer({ [spec.dataKey]: spec.config }, new Error('Gateway timeout'));
        renderWithProviders(<spec.Panel />);
        expect(screen.getByRole('heading', { level: 2, name: spec.title })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
      });
    }
  });
}
