import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { CreateApplicantDocument } from '@exyconn/shell/graphql/generated';
import { ApplicantForm } from './applicant.form';

const VALID = { name: 'Meera Iyer', email: 'meera@example.com', jobTitle: 'Senior Engineer' };

const createMock: MockedResponse = {
  request: {
    query: CreateApplicantDocument,
    variables: {
      input: {
        ...VALID,
        phone: '',
        jobCode: '',
        companySlug: '',
        resumeUrl: '',
        coverLetter: '',
        source: 'MANUAL',
        rating: 0,
      },
    },
  },
  result: { data: { createApplicant: { id: 'a1' } } },
};

const mount = (mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ApplicantForm
            initial={null}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ApplicantForm', () => {
  it('refuses an empty applicant and says what is missing', () => {
    mount();
    cy.contains('button', 'Create').click();

    cy.contains('Name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
    cy.contains('Job title is required').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('rejects a malformed email address', () => {
    mount();
    cy.get('input[name="name"]').type(VALID.name);
    cy.get('input[name="jobTitle"]').type(VALID.jobTitle);
    cy.get('input[name="email"]').type('meera@');
    cy.contains('button', 'Create').click();

    cy.contains('Enter a valid email address').should('be.visible');
  });

  it('creates the applicant and calls onDone', () => {
    mount([createMock]);
    cy.get('input[name="name"]').type(VALID.name);
    cy.get('input[name="email"]').type(VALID.email);
    cy.get('input[name="jobTitle"]').type(VALID.jobTitle);
    cy.contains('button', 'Create').click();

    cy.get('@done').should('have.been.called');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();

    cy.get('@cancel').should('have.been.called');
  });
});
