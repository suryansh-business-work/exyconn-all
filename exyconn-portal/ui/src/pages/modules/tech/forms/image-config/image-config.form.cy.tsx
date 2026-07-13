import { MockedProvider } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { ImageConfigForm } from './image-config.form';
import { NotificationProvider } from '../../../../../components/feedback/NotificationProvider';
import { theme } from '../../../../../config/theme';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ImageConfigForm initial={null} onDone={cy.stub()} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('ImageConfigForm', () => {
  it('requires the provider credentials', () => {
    mount();
    cy.contains('button', 'Create').click();
    cy.contains('Label is required').should('be.visible');
    cy.contains('Public key is required').should('be.visible');
    cy.contains('Private key is required').should('be.visible');
  });

  it('validates the URL endpoint', () => {
    mount();
    cy.get('input[name="urlEndpoint"]').type('not-a-url');
    cy.contains('Enter a valid URL').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
