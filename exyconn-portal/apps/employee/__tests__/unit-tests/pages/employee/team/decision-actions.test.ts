import { describe, expect, it, vi } from 'vitest';
import { decisionActions } from '../../../../../src/pages/employee/team/decision-actions';

interface Row {
  id: string;
  status: string;
}

const pending: Row = { id: 'r-1', status: 'PENDING' };
const approved: Row = { id: 'r-2', status: 'APPROVED' };

describe('decisionActions', () => {
  it('offers approve then reject, labelled and coloured for each', () => {
    const [approve, reject] = decisionActions<Row>(vi.fn(), vi.fn());

    expect(approve).toMatchObject({ tooltip: 'Approve', ariaLabel: 'approve', color: 'success' });
    expect(reject).toMatchObject({ tooltip: 'Reject', ariaLabel: 'reject', color: 'error' });
  });

  it('routes each button to its own handler with the row', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const [approve, reject] = decisionActions<Row>(onApprove, onReject);

    approve.onClick(pending);
    reject.onClick(pending);

    expect(onApprove).toHaveBeenCalledWith(pending);
    expect(onReject).toHaveBeenCalledWith(pending);
  });

  it('shows the buttons only while the row is still pending', () => {
    const actions = decisionActions<Row>(vi.fn(), vi.fn());

    for (const action of actions) {
      expect(action.hidden?.(pending)).toBe(false);
      expect(action.hidden?.(approved)).toBe(true);
      expect(action.hidden?.({ id: 'r-3', status: 'REJECTED' })).toBe(true);
    }
  });
});
