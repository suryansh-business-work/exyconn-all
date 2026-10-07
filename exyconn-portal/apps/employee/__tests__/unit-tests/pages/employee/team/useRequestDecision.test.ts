import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestStatus, useDecideEmployeeRequestMutation } from '@exyconn/shell/graphql/generated';
import { mutationTuple } from '../apolloHookMocks';
import { useRequestDecision } from '../../../../../src/pages/employee/team/useRequestDecision';

const { confirm, notify } = vi.hoisted(() => ({ confirm: vi.fn(), notify: vi.fn() }));

vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', () => ({
  useConfirm: () => confirm,
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', () => ({
  useNotify: () => notify,
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDecideEmployeeRequestMutation: vi.fn(),
}));

const decide = vi.fn();
const row = { id: 'req-1', subject: 'Work from home Friday' };

function setup() {
  const refetch = vi.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => useRequestDecision(refetch));
  return { decideRequest: result.current, refetch };
}

beforeEach(() => {
  confirm.mockReset();
  notify.mockReset();
  decide.mockReset();
  vi.mocked(useDecideEmployeeRequestMutation).mockReturnValue(
    mutationTuple<typeof useDecideEmployeeRequestMutation>(decide),
  );
});

describe('useRequestDecision', () => {
  it('confirms an approval by subject, records it, refreshes and says so', async () => {
    confirm.mockResolvedValue(true);
    decide.mockResolvedValue({ data: { decideEmployeeRequest: { id: 'req-1' } } });
    const { decideRequest, refetch } = setup();

    await decideRequest(row, RequestStatus.Approved);

    expect(confirm).toHaveBeenCalledWith({
      message: 'Approve “{subject}”?',
      messageValues: { subject: 'Work from home Friday' },
      confirmText: 'Approve',
    });
    expect(decide).toHaveBeenCalledWith({
      variables: { id: 'req-1', status: RequestStatus.Approved },
    });
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith('Request approved');
  });

  it('uses the rejection wording for a rejection', async () => {
    confirm.mockResolvedValue(true);
    decide.mockResolvedValue({ data: { decideEmployeeRequest: { id: 'req-1' } } });
    const { decideRequest } = setup();

    await decideRequest(row, RequestStatus.Rejected);

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Reject “{subject}”?', confirmText: 'Reject' }),
    );
    expect(decide).toHaveBeenCalledWith({
      variables: { id: 'req-1', status: RequestStatus.Rejected },
    });
    expect(notify).toHaveBeenCalledWith('Request rejected');
  });

  it('does nothing when the manager backs out', async () => {
    confirm.mockResolvedValue(false);
    const { decideRequest, refetch } = setup();

    await decideRequest(row, RequestStatus.Approved);

    expect(decide).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('reports the server’s message and skips the refresh when the decision fails', async () => {
    confirm.mockResolvedValue(true);
    decide.mockRejectedValue(new Error('Request was already decided'));
    const { decideRequest, refetch } = setup();

    await decideRequest(row, RequestStatus.Approved);

    expect(refetch).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith('Request was already decided', 'error');
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    confirm.mockResolvedValue(true);
    decide.mockRejectedValue('forbidden');
    const { decideRequest } = setup();

    await decideRequest(row, RequestStatus.Rejected);

    expect(notify).toHaveBeenCalledWith('Could not update the request', 'error');
  });
});
