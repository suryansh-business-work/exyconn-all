import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { WhatsappWorkflowStatus } from '@exyconn/shell/graphql/generated';
import { WorkflowStatusChip } from '../../../../../src/admin/workflows/model/WorkflowStatusChip';
import { renderWithProviders } from '../../../test-utils';

describe('WorkflowStatusChip', () => {
  it('shows the published version', () => {
    renderWithProviders(
      <WorkflowStatusChip status={WhatsappWorkflowStatus.Published} version={3} />,
    );
    expect(screen.getByText('Published v3')).toBeInTheDocument();
  });

  it('shows a draft edited since its last publish with the live version', () => {
    renderWithProviders(<WorkflowStatusChip status={WhatsappWorkflowStatus.Draft} version={2} />);
    expect(screen.getByText('Draft · live v2')).toBeInTheDocument();
  });

  it('shows a plain Draft for a workflow never published', () => {
    renderWithProviders(<WorkflowStatusChip status={WhatsappWorkflowStatus.Draft} version={0} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('translates the label', () => {
    renderWithProviders(
      <WorkflowStatusChip status={WhatsappWorkflowStatus.Published} version={1} />,
      { messages: { 'Published v{version}': 'Publié v{version}' } },
    );
    expect(screen.getByText('Publié v1')).toBeInTheDocument();
  });
});
