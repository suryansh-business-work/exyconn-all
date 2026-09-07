import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SetApplicantStageDocument } from '@exyconn/shell/graphql/generated';
import { ApplicantStageForm } from './applicant-stage.form';
import type { StagedApplicant } from './applicant-stage.types';

const applicant: StagedApplicant = { id: 'a1', name: 'Meera Iyer', stage: 'NEW' as never };

const moveMock: MockedResponse = {
  request: {
    query: SetApplicantStageDocument,
    variables: { id: 'a1', stage: 'OFFER', note: 'Panel agreed' },
  },
  result: {
    data: {
      setApplicantStage: {
        id: 'a1',
        stage: 'OFFER',
        stageChangedAt: '2026-09-07T10:00:00Z',
        notes: 'Panel agreed',
      },
    },
  },
};

const mount = (mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ApplicantStageForm
            applicant={applicant}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

const chooseStage = (label: string) => {
  cy.get('[role="combobox"]').click();
  cy.get('li[role="option"]').contains(label).click();
};

describe('ApplicantStageForm', () => {
  it('shows who is being moved and where they are', () => {
    mount();
    cy.contains('Meera Iyer · currently new').should('be.visible');
  });

  it('warns that the applicant will be emailed for an offer', () => {
    mount();
    chooseStage('Offer');
    cy.contains('will be emailed').should('be.visible');
  });

  it('stays quiet about email for screening', () => {
    mount();
    chooseStage('Screening');
    cy.contains('will be emailed').should('not.exist');
  });

  it('moves the applicant and calls onDone', () => {
    mount([moveMock]);
    chooseStage('Offer');
    cy.get('textarea[name="note"]').type('Panel agreed');
    cy.contains('button', 'Move').click();

    cy.get('@done').should('have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();

    cy.get('@cancel').should('have.been.called');
  });
});
