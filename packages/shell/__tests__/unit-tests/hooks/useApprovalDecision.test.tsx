import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@exyconn/i18n';
import {
  ApprovalDecision,
  MyPendingApprovalCountDocument,
  useDecideApprovalMutation,
} from '@/graphql/generated';
import { DECISION_VERB, useApprovalDecision } from '@/hooks/useApprovalDecision';

const { confirm, notify } = vi.hoisted(() => ({ confirm: vi.fn(), notify: vi.fn() }));

vi.mock('@/components/feedback/ConfirmProvider', () => ({ useConfirm: () => confirm }));
vi.mock('@/components/feedback/NotificationProvider', () => ({ useNotify: () => notify }));
vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useDecideApprovalMutation: vi.fn(),
}));

const decide = vi.fn();
const row = { id: 'ap-1', kindLabel: 'Leave request' };
const MESSAGES = { 'leave request': 'demande de congé', 'Leave request': 'Demande de congé' };

function setup() {
  const refetch = vi.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useApprovalDecision(refetch), {
    wrapper: ({ children }: Readonly<{ children: ReactNode }>) => (
      <I18nProvider locale="fr" messages={MESSAGES}>
        {children}
      </I18nProvider>
    ),
  });
  return { decideApproval: result.current, refetch };
}

beforeEach(() => {
  confirm.mockReset();
  notify.mockReset();
  decide.mockReset();
  vi.mocked(useDecideApprovalMutation).mockReturnValue([decide] as unknown as ReturnType<
    typeof useDecideApprovalMutation
  >);
});

describe('useApprovalDecision', () => {
  it('names the verbs each decision is confirmed with', () => {
    expect(DECISION_VERB[ApprovalDecision.Approved]).toBe('Approve');
    expect(DECISION_VERB[ApprovalDecision.Rejected]).toBe('Reject');
  });

  it('refreshes the pending-approval badge after every decision', () => {
    setup();
    expect(useDecideApprovalMutation).toHaveBeenCalledWith({
      refetchQueries: [MyPendingApprovalCountDocument],
    });
  });

  it('confirms an approval with the translated, lower-cased kind, then records it', async () => {
    confirm.mockResolvedValue(true);
    decide.mockResolvedValue({ data: { decideApproval: true } });
    const { decideApproval, refetch } = setup();

    await decideApproval(row, ApprovalDecision.Approved);

    expect(confirm).toHaveBeenCalledWith({
      message: 'Approve this {kind}?',
      messageValues: { kind: 'demande de congé' },
      confirmText: 'Approve',
    });
    expect(decide).toHaveBeenCalledWith({
      variables: { id: 'ap-1', decision: ApprovalDecision.Approved },
    });
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith('{kind} approved', 'success', { kind: 'Demande de congé' });
  });

  it('uses the rejection wording for a rejection', async () => {
    confirm.mockResolvedValue(true);
    decide.mockResolvedValue({ data: { decideApproval: true } });
    const { decideApproval } = setup();

    await decideApproval(row, ApprovalDecision.Rejected);

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Reject this {kind}?', confirmText: 'Reject' }),
    );
    expect(notify).toHaveBeenCalledWith('{kind} rejected', 'success', { kind: 'Demande de congé' });
  });

  it('does nothing when the person cancels', async () => {
    confirm.mockResolvedValue(false);
    const { decideApproval, refetch } = setup();
    await decideApproval(row, ApprovalDecision.Approved);
    expect(decide).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it("shows the server's message when the decision fails", async () => {
    confirm.mockResolvedValue(true);
    decide.mockRejectedValue(new Error('Already decided'));
    const { decideApproval, refetch } = setup();
    await decideApproval(row, ApprovalDecision.Approved);
    expect(refetch).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith('Already decided', 'error');
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    confirm.mockResolvedValue(true);
    decide.mockResolvedValue({});
    const { decideApproval, refetch } = setup();
    refetch.mockRejectedValue('offline');
    await decideApproval(row, ApprovalDecision.Rejected);
    expect(notify).toHaveBeenCalledWith('Could not record the decision', 'error');
  });
});
