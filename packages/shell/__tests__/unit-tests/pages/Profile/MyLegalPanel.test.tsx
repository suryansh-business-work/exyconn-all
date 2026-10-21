import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LegalItemKind,
  MyLegalAssignmentBodyDocument,
  MyLegalAssignmentsDocument,
} from '@/graphql/generated';
import { MyLegalPanel } from '@/pages/Profile/MyLegalPanel';
import { renderWithProviders } from '../../test-utils';
import { answer, failure } from '../../mockResult';
import { assignment } from '../../components/legal/legalFixtures';

const FILE = 'https://cdn.example.com/offer.pdf';
const MINE = [
  assignment('a1', 'c1', 'Part-time offer', { groupName: 'Part Time Employee Contracts' }),
  assignment('a2', 'd1', 'Handbook', {
    kind: LegalItemKind.Document,
    hasBody: false,
    fileUrl: FILE,
  }),
];
const mine = () =>
  answer(MyLegalAssignmentsDocument, { myLegalAssignments: MINE }, undefined, 3).mock;

afterEach(() => vi.restoreAllMocks());

describe('MyLegalPanel', () => {
  it('lists what was handed over, offering Read for text and Open for a file', async () => {
    renderWithProviders(<MyLegalPanel />, { mocks: [mine()] });

    expect(await screen.findByText('Part-time offer')).toBeInTheDocument();
    expect(screen.getByText('Part Time Employee Contracts')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'read' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'open the file' })).toHaveLength(1);
  });

  it('opens the attached file in a new tab', async () => {
    const open = vi.spyOn(globalThis, 'open').mockReturnValue(null);
    renderWithProviders(<MyLegalPanel />, { mocks: [mine()] });

    await userEvent.click(await screen.findByRole('button', { name: 'open the file' }));

    expect(open).toHaveBeenCalledWith(FILE, '_blank', 'noopener,noreferrer');
  });

  it('reads the text in a dialog, and closes it', async () => {
    const body = answer(
      MyLegalAssignmentBodyDocument,
      { myLegalAssignmentBody: '<p>Hours are flexible.</p>' },
      { id: 'a1' },
    );
    renderWithProviders(<MyLegalPanel />, { mocks: [mine(), body.mock] });
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'read' }));

    expect(await screen.findByText('Hours are flexible.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Hours are flexible.')).not.toBeInTheDocument());
  });

  it('says why the text could not be read', async () => {
    renderWithProviders(<MyLegalPanel />, {
      mocks: [mine(), failure(MyLegalAssignmentBodyDocument, { id: 'a1' })],
    });

    await userEvent.click(await screen.findByRole('button', { name: 'read' }));

    expect(await screen.findByText('The network is down')).toBeInTheDocument();
  });

  it('says why the list could not be read', async () => {
    renderWithProviders(<MyLegalPanel />, { mocks: [failure(MyLegalAssignmentsDocument)] });

    expect(await screen.findByText('The network is down')).toBeInTheDocument();
  });
});
