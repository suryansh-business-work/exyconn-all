import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { KbArticleForm } from './kb-article.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <KbArticleForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('KbArticleForm', () => {
  it('requires a searchable title, a slug and a real answer', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Give the article a title somebody could search for').should('be.visible');
    cy.contains('Slug must be at least 3 characters').should('be.visible');
    cy.contains('An answer this short will not help anybody').should('be.visible');
  });

  it('rejects a slug that could not appear in a link', () => {
    mount();
    cy.get('input[name="slug"]').type('Reset VPN Password');
    cy.contains('button', 'Create').click();
    cy.contains('Lowercase letters, digits and hyphens only').should('be.visible');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
