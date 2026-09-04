import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { DocPageForm } from './doc-page.form';
import type { DocPageRow } from './doc-page.types';

const page = {
  id: 'p1',
  projectId: 'proj1',
  parentId: null,
  title: 'Release process',
  body: '<p>Ship it on a Tuesday.</p>',
  order: 0,
  updatedByName: 'Asha Rao',
  updatedAt: '2026-09-04T00:00:00.000Z',
} as DocPageRow;

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <DocPageForm
            page={page}
            onSubmit={cy.stub().as('submit').resolves()}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('DocPageForm', () => {
  it('opens on the page it was given', () => {
    mount();
    cy.get('input[name="title"]').should('have.value', 'Release process');
    cy.contains('Ship it on a Tuesday.').should('be.visible');
  });

  it('requires a title', () => {
    mount();
    cy.get('input[name="title"]').clear();
    cy.contains('button', 'Save page').click();
    cy.contains('Title is required').should('be.visible');
    cy.get('@submit').should('not.have.been.called');
  });

  it('saves the edited title', () => {
    mount();
    cy.get('input[name="title"]').clear().type('How we release');
    cy.contains('button', 'Save page').click();
    cy.get('@submit').should('have.been.calledWithMatch', { title: 'How we release' });
  });
});
