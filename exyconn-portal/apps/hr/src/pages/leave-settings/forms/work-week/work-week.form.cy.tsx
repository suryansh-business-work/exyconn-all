import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SetDefaultWorkDaysDocument } from '@exyconn/shell/graphql/generated';
import { WorkWeekForm } from './work-week.form';

const saveMock = (days: number[]): MockLink.MockedResponse => ({
  request: { query: SetDefaultWorkDaysDocument, variables: { days } },
  result: {
    data: { setDefaultWorkDays: { __typename: 'WorkWeek', defaultWorkDays: days } },
  },
});

const failingSave: MockLink.MockedResponse = {
  request: { query: SetDefaultWorkDaysDocument, variables: { days: [1, 2, 3, 4, 5] } },
  error: new Error('Only HR admins can change the work week'),
};

const mount = (mocks: MockLink.MockedResponse[] = [], defaultWorkDays = [1, 2, 3, 4, 5]) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <WorkWeekForm
            initial={{ __typename: 'WorkWeek', defaultWorkDays }}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

const day = (name: string) => cy.contains('[role="button"]', name);

describe('WorkWeekForm', () => {
  it('opens on the saved week', () => {
    mount();
    day('Monday').should('have.attr', 'aria-pressed', 'true');
    day('Friday').should('have.attr', 'aria-pressed', 'true');
    day('Saturday').should('have.attr', 'aria-pressed', 'false');
    day('Sunday').should('have.attr', 'aria-pressed', 'false');
  });

  it('refuses a week with no working day', () => {
    mount([], [3]);
    day('Wednesday').click();
    cy.contains('button', 'Save work week').click();
    cy.contains('Pick at least one working day').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('saves the week with Saturday added and calls onDone', () => {
    mount([saveMock([1, 2, 3, 4, 5, 6])]);
    day('Saturday').click();
    day('Saturday').should('have.attr', 'aria-pressed', 'true');
    cy.contains('button', 'Save work week').click();
    cy.get('@done').should('have.been.called');
    cy.contains('Work week saved').should('be.visible');
  });

  it('shows the server error and stays open', () => {
    mount([failingSave]);
    cy.contains('button', 'Save work week').click();
    cy.contains('Only HR admins can change the work week').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
