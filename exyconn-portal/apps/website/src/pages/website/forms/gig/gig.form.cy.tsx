import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { GigForm } from './gig.form';
import { CreateGigDocument } from '@exyconn/shell/graphql/generated';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const NEW_GIG = {
  gigCode: 'GIG-001',
  title: 'Landing page revamp',
  category: 'Design',
  duration: '1-2 weeks',
  status: 'open',
  applicationType: 'email',
  applicationContact: 'gigs@exyconn.com',
};

/** Exactly what GigForm submits when only the required fields are filled in. */
const createMock = {
  request: {
    query: CreateGigDocument,
    variables: {
      input: {
        gigCode: NEW_GIG.gigCode,
        title: NEW_GIG.title,
        category: NEW_GIG.category,
        shortDescription: '',
        fullDescription: '',
        deliverables: [],
        requirements: [],
        tags: [],
        budget: '',
        duration: NEW_GIG.duration,
        status: NEW_GIG.status,
        applicationType: NEW_GIG.applicationType,
        applicationContact: NEW_GIG.applicationContact,
        postedDate: null,
        deadline: null,
        isUrgent: false,
      },
    },
  },
  result: { data: { createGig: { id: 'gig-1' } } },
};

const mount = (mocks: (typeof createMock)[] = []) =>
  cy.mount(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <GigForm initial={null} onDone={cy.stub().as('done')} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

const pickOption = (field: string, value: string) => {
  cy.get(`#mui-component-select-${field}`).click();
  cy.get(`li[data-value="${value}"]`).click();
};

describe('GigForm', () => {
  it('validates every required field', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Gig code is required').should('be.visible');
    cy.contains('Title is required').should('be.visible');
    cy.contains('Category is required').should('be.visible');
    cy.contains('Duration is required').should('be.visible');
    cy.contains('Status is required').should('be.visible');
    cy.contains('Application type is required').should('be.visible');
    cy.contains('Application contact is required').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('submits a new gig and calls onDone', () => {
    mount([createMock]);
    cy.get('input[name="gigCode"]').type(NEW_GIG.gigCode);
    cy.get('input[name="title"]').type(NEW_GIG.title);
    pickOption('category', NEW_GIG.category);
    pickOption('duration', NEW_GIG.duration);
    pickOption('status', NEW_GIG.status);
    pickOption('applicationType', NEW_GIG.applicationType);
    cy.get('input[name="applicationContact"]').type(NEW_GIG.applicationContact);
    cy.contains('button', 'Create').click();
    cy.contains('Gig created').should('be.visible');
    cy.get('@done').should('have.been.called');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
