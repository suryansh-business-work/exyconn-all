import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { SubmissionPayload } from './SubmissionPayload';

const mount = (data: unknown) =>
  cy.mount(
    <ThemeProvider theme={theme}>
      <SubmissionPayload data={data} />
    </ThemeProvider>,
  );

describe('SubmissionPayload', () => {
  it('lists each field with a label, email ready to click', () => {
    mount({ firstName: 'Asha', email: 'a@x.co', message: 'Line one\nLine two' });
    cy.contains('dt', 'First name').next('dd').should('have.text', 'Asha');
    cy.contains('a', 'a@x.co').should('have.attr', 'href', 'mailto:a@x.co');
    cy.contains('dt', 'Message').should('be.visible');
  });

  it('says so when nothing was captured', () => {
    mount(null);
    cy.contains('No payload captured for this submission.').should('be.visible');
  });
});
