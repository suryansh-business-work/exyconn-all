import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { WhatsappWorkflowStatus } from '@exyconn/shell/graphql/generated';
import { workflowColumns } from '../../../../../src/admin/workflows/list/workflow-columns';
import { workflowRow } from '../../admin.fixtures';
import { renderWithProviders } from '../../../test-utils';

function column(key: string, formatDateTime = vi.fn((value: string) => `at ${value}`)) {
  const found = workflowColumns(formatDateTime).find((c) => c.key === key);
  if (!found) {
    throw new Error(`no column ${key}`);
  }
  return found;
}

describe('workflowColumns', () => {
  it('lists name, key, status, menu position, keywords and update time in order', () => {
    expect(workflowColumns(String).map((c) => c.label)).toEqual([
      'Name',
      'Key',
      'Status',
      'Menu position',
      'Keywords',
      'Updated',
    ]);
  });

  it('shows the status chip for the row', () => {
    const status = column('status');
    renderWithProviders(
      <>{status.render?.(workflowRow({ status: WhatsappWorkflowStatus.Published, version: 4 }))}</>,
    );
    expect(screen.getByText('Published v4')).toBeInTheDocument();
  });

  it('joins keywords, or shows a dash when there are none', () => {
    const keywords = column('keywords');
    expect(keywords.render?.(workflowRow({ keywords: ['book', 'visit'] }))).toBe('book, visit');
    expect(keywords.render?.(workflowRow({ keywords: [] }))).toBe('—');
  });

  it("formats the update time with the viewer's formatter", () => {
    const formatDateTime = vi.fn((value: string) => `at ${value}`);
    const updated = column('updatedAt', formatDateTime);
    expect(updated.render?.(workflowRow())).toBe('at 2026-10-01T10:00:00.000Z');
    expect(formatDateTime).toHaveBeenCalledWith('2026-10-01T10:00:00.000Z');
  });
});
