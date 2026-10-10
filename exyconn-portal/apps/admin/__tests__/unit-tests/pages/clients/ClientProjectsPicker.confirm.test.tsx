import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { ListProjectsDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { ClientProjectsPicker } from '../../../../src/pages/clients/hub-access/ClientProjectsPicker';
import { listedProject } from './hub-access.fixtures';

vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useConfirm: () => () => Promise.reject(new Error('Confirmation unavailable')),
}));

const app = listedProject({
  id: 'project-2',
  name: 'Mobile app',
  clientId: 'client-9',
  clientName: 'Globex',
});

const list: MockLink.MockedResponse = {
  request: { query: ListProjectsDocument },
  result: { data: { listProjects: [app] } },
};

describe('ClientProjectsPicker when the move confirmation fails', () => {
  it('says why instead of dropping the error', async () => {
    renderWithProviders(<ClientProjectsPicker clientId="client-1" />, { mocks: [list] });

    await userEvent.click(await screen.findByRole('checkbox', { name: /Mobile app/ }));

    await waitFor(() =>
      expect(document.querySelector('.MuiSnackbar-root')).toHaveTextContent(
        'Confirmation unavailable',
      ),
    );
  });
});
