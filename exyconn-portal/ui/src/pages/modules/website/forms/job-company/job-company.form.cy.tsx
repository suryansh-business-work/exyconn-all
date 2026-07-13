import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { JobCompanyForm } from './job-company.form';
import { CreateJobCompanyDocument } from '../../../../../graphql/generated';
import { NotificationProvider } from '../../../../../components/feedback/NotificationProvider';
import { theme } from '../../../../../config/theme';

const NEW_COMPANY = { companyCode: 'EXY', slug: 'exyconn', name: 'Exyconn' };

/** Exactly what JobCompanyForm submits when only the required fields are filled in. */
const createMock: MockedResponse = {
  request: {
    query: CreateJobCompanyDocument,
    variables: {
      input: {
        companyCode: NEW_COMPANY.companyCode,
        slug: NEW_COMPANY.slug,
        name: NEW_COMPANY.name,
        logo: '',
        tagline: '',
        description: '',
        culture: '',
        website: '',
        founded: '',
        employees: '',
        industry: '',
        headquarters: '',
        benefits: [],
        socialLinks: { linkedin: '', twitter: '', facebook: '', instagram: '' },
        brandColor: '',
        secondaryColor: '',
        isActive: true,
        order: 0,
      },
    },
  },
  result: { data: { createJobCompany: { id: 'company-1' } } },
};

const mount = (mocks: MockedResponse[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <JobCompanyForm
            initial={null}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('JobCompanyForm', () => {
  it('validates the required company code, slug and name', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Company code is required').should('be.visible');
    cy.contains('Slug is required').should('be.visible');
    cy.contains('Name is required').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('validates the icon and title of an added benefit', () => {
    mount();
    cy.contains('button', 'Add benefit').click();
    cy.contains('button', 'Create').click();
    cy.contains('Icon is required').should('be.visible');
    cy.contains('Benefit title is required').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('submits a new company and calls onDone', () => {
    mount([createMock]);
    cy.get('input[name="companyCode"]').type(NEW_COMPANY.companyCode);
    cy.get('input[name="slug"]').type(NEW_COMPANY.slug);
    cy.get('input[name="name"]').type(NEW_COMPANY.name);
    cy.contains('button', 'Create').click();
    cy.contains('Company created').should('be.visible');
    cy.get('@done').should('have.been.called');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
