import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LeaveStatus, useSetLeaveStatusMutation } from '@/graphql/generated';
import {
  LEAVE_DECISION_DONE,
  LEAVE_DECISION_PROMPT,
  LEAVE_DECISION_VERB,
  useLeaveDecision,
} from '@/hooks/useLeaveDecision';

const { confirm, notify } = vi.hoisted(() => ({ confirm: vi.fn(), notify: vi.fn() }));

vi.mock('@/components/feedback/ConfirmProvider', () => ({ useConfirm: () => confirm }));
vi.mock('@/components/feedback/NotificationProvider', () => ({ useNotify: () => notify }));
vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useSetLeaveStatusMutation: vi.fn(),
}));

const setStatus = vi.fn();

function setup() {
  const refetch = vi.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useLeaveDecision(refetch));
  return { decide: result.current, refetch };
}

beforeEach(() => {
  confirm.mockReset();
  notify.mockReset();
  setStatus.mockReset();
  vi.mocked(useSetLeaveStatusMutation).mockReturnValue([setStatus] as unknown as ReturnType<
    typeof useSetLeaveStatusMutation
  >);
});

describe('leave decision wording', () => {
  it('has a whole sentence for every decision', () => {
    expect(LEAVE_DECISION_PROMPT[LeaveStatus.Approved]).toBe('Approve this leave request?');
    expect(LEAVE_DECISION_PROMPT[LeaveStatus.Rejected]).toBe('Reject this leave request?');
    expect(LEAVE_DECISION_VERB[LeaveStatus.Rejected]).toBe('Reject');
    expect(LEAVE_DECISION_DONE[LeaveStatus.Approved]).toBe('Leave approved');
  });
});

describe('useLeaveDecision', () => {
  it('confirms, moves the request, refreshes and tells the person', async () => {
    confirm.mockResolvedValue(true);
    setStatus.mockResolvedValue({ data: { setLeaveStatus: { id: 'lv-1' } } });
    const { decide, refetch } = setup();

    await decide({ id: 'lv-1' }, LeaveStatus.Approved);

    expect(confirm).toHaveBeenCalledWith({
      message: 'Approve this leave request?',
      confirmText: 'Approve',
    });
    expect(setStatus).toHaveBeenCalledWith({
      variables: { id: 'lv-1', status: LeaveStatus.Approved },
    });
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith('Leave approved');
  });

  it('tells the person a rejection went through', async () => {
    confirm.mockResolvedValue(true);
    setStatus.mockResolvedValue({});
    const { decide } = setup();
    await decide({ id: 'lv-2' }, LeaveStatus.Rejected);
    expect(notify).toHaveBeenCalledWith('Leave rejected');
  });

  it('stops when the person cancels', async () => {
    confirm.mockResolvedValue(false);
    const { decide, refetch } = setup();
    await decide({ id: 'lv-1' }, LeaveStatus.Rejected);
    expect(setStatus).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });

  it("shows the server's message when the update fails", async () => {
    confirm.mockResolvedValue(true);
    setStatus.mockRejectedValue(new Error('Insufficient balance'));
    const { decide, refetch } = setup();
    await decide({ id: 'lv-1' }, LeaveStatus.Approved);
    expect(refetch).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith('Insufficient balance', 'error');
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    confirm.mockResolvedValue(true);
    setStatus.mockRejectedValue('offline');
    const { decide } = setup();
    await decide({ id: 'lv-1' }, LeaveStatus.Approved);
    expect(notify).toHaveBeenCalledWith('Could not update the leave request', 'error');
  });
});
