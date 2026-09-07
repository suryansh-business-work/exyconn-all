import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { GoalCommentForm } from './goal-comment.form';
import type { TeamGoalRow } from './goal-comment.types';

const goal = {
  id: 'g1',
  employeeId: 'e1',
  title: 'Ship billing',
  kpi: 'Invoices sent',
  weightage: 40,
  endDate: '2026-06-30T00:00:00.000Z',
  progress: 50,
  status: 'ACTIVE',
  managerComment: null,
} as TeamGoalRow;

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <GoalCommentForm goal={goal} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('GoalCommentForm', () => {
  it('requires a comment', () => {
    mount();
    cy.contains('button', 'Save comment').click();
    cy.contains('Comment is required').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
