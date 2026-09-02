import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { CreateNavLinkDocument } from '@exyconn/shell/graphql/generated';
import { NavLinkForm } from './nav-link.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';

const createMock: MockedResponse = {
  request: {
    query: CreateNavLinkDocument,
    variables: {
      input: {
        label: 'AI Consulting',
        href: '/services/ai-consulting',
        description: '',
        category: 'Services',
        keywords: '',
        isActive: true,
        order: 0,
      },
    },
  },
  result: { data: { createNavLink: { id: 'n1' } } },
};

const mount = (mocks: MockedResponse[]) =>
  cy.mount(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <NavLinkForm
            initial={null}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('NavLinkForm', () => {
  it('requires the label, link URL and category', () => {
    mount([]);
    cy.contains('button', 'Create').click();
    cy.contains('Label is required').should('be.visible');
    cy.contains('Link URL is required').should('be.visible');
    cy.contains('Category is required').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('creates a nav link and calls onDone', () => {
    mount([createMock]);
    cy.get('input[name="label"]').type('AI Consulting');
    cy.get('input[name="href"]').type('/services/ai-consulting');
    cy.get('[role="combobox"]').click();
    cy.get('li[role="option"]').contains('Services').click();
    cy.contains('button', 'Create').click();
    cy.get('@done').should('have.been.called');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount([]);
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
