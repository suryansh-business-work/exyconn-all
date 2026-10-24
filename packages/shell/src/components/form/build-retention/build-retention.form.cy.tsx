import { ThemeProvider } from '@/components/ui/styles';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { theme } from '@/config/theme';
import { BuildRetentionForm } from './build-retention.form';

const mount = (keepLatestBuilds = 5) =>
  cy.mount(
    <ThemeProvider theme={theme}>
      <NotificationProvider>
        <BuildRetentionForm
          keepLatestBuilds={keepLatestBuilds}
          save={cy.stub().as('save').resolves()}
        />
      </NotificationProvider>
    </ThemeProvider>,
  );

describe('BuildRetentionForm', () => {
  it('starts from the stored count', () => {
    mount(7);
    cy.get('input[name="keepLatestBuilds"]').should('have.value', '7');
  });

  it('refuses a negative count', () => {
    mount();
    cy.get('input[name="keepLatestBuilds"]').clear().type('-1');
    cy.contains('button', 'Save').click();
    cy.contains('Enter 0 or more').should('be.visible');
    cy.get('@save').should('not.have.been.called');
  });

  it('refuses more than it can keep', () => {
    mount();
    cy.get('input[name="keepLatestBuilds"]').clear().type('501');
    cy.contains('button', 'Save').click();
    cy.contains('Keep at most 500 builds').should('be.visible');
  });

  it('saves a valid count', () => {
    mount();
    cy.get('input[name="keepLatestBuilds"]').clear().type('12');
    cy.contains('button', 'Save').click();
    cy.get('@save').should('have.been.calledOnceWith', 12);
    cy.contains('Build retention saved').should('be.visible');
  });

  it('puts the stored count back on Cancel', () => {
    mount(3);
    cy.get('input[name="keepLatestBuilds"]').clear().type('9');
    cy.contains('button', 'Cancel').click();
    cy.get('input[name="keepLatestBuilds"]').should('have.value', '3');
  });
});
