import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { ManagerAssessmentForm } from './manager-assessment.form';
import type { TeamReviewRow } from './manager-assessment.types';

const review: TeamReviewRow = {
  id: 'r1',
  employeeId: 'e1',
  cycle: 'H1 2026',
  selfAssessment: 'Shipped the billing rewrite.',
  managerAssessment: '',
  score: null,
  status: 'SELF_SUBMITTED',
  updatedAt: '2026-03-01T00:00:00.000Z',
} as TeamReviewRow;

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ManagerAssessmentForm
            review={review}
            onDone={cy.stub()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ManagerAssessmentForm', () => {
  it('shows the self-assessment being reviewed', () => {
    mount();
    cy.contains('Shipped the billing rewrite.').should('be.visible');
  });

  it('requires a real assessment', () => {
    mount();
    cy.get('textarea[name="managerAssessment"]').first().type('ok');
    cy.contains('button', 'Submit assessment').click();
    cy.contains('Write at least a few sentences (20+ characters)').should('be.visible');
  });

  it('keeps the score between 0 and 10', () => {
    mount();
    cy.get('input[name="score"]').type('11');
    cy.contains('button', 'Submit assessment').click();
    cy.contains('Score must be between 0 and 10').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
