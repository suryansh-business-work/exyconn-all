import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';
import { EmployeeEmailKind, VerifyEmployeeEmailCodeDocument } from '@/graphql/generated';
import { EmployeeEmailCodeForm } from './employee-email-code.form';

const ADDRESS = 'meera@home.test';

const verified: MockLink.MockedResponse = {
  request: {
    query: VerifyEmployeeEmailCodeDocument,
    variables: ({ code }: Record<string, unknown>) => code === '123456',
  },
  result: {
    data: {
      verifyEmployeeEmailCode: {
        __typename: 'User',
        id: 'emp-1',
        email: 'meera@example.com',
        emailVerifiedAt: null,
        personalEmail: ADDRESS,
        personalEmailVerifiedAt: '2026-06-15T10:00:00.000Z',
      },
    },
  },
};

const refused: MockLink.MockedResponse = {
  request: {
    query: VerifyEmployeeEmailCodeDocument,
    variables: ({ code }: Record<string, unknown>) => code === '000000',
  },
  error: new Error('That code is wrong or has expired'),
};

const mount = (mocks: MockLink.MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <EmployeeEmailCodeForm
            employeeId="emp-1"
            kind={EmployeeEmailKind.Personal}
            address={ADDRESS}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('EmployeeEmailCodeForm', () => {
  it('says where the code went and requires it', () => {
    mount();
    cy.contains(`A 6-digit code was emailed to ${ADDRESS}`).should('be.visible');
    cy.contains('button', 'Verify').click();
    cy.contains('Enter the code from the email').should('be.visible');
  });

  it('accepts only six digits', () => {
    mount();
    cy.get('input[name="code"]').type('12a4');
    cy.contains('button', 'Verify').click();
    cy.contains('The code is 6 digits').should('be.visible');
    cy.get('input[name="code"]').should('have.attr', 'maxlength', '6');
  });

  it('verifies the address with a right code', () => {
    mount([verified]);
    cy.get('input[name="code"]').type('123456');
    cy.contains('button', 'Verify').click();
    cy.contains(`${ADDRESS} is verified`).should('be.visible');
    cy.get('@done').should('have.been.calledOnce');
  });

  it('says why a wrong code was refused and stays open', () => {
    mount([refused]);
    cy.get('input[name="code"]').type('000000');
    cy.contains('button', 'Verify').click();
    cy.contains('That code is wrong or has expired').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
