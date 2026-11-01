import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { ToolCallForm } from './tool-call.form';

const mount = (initialArgs: string, busy = false) =>
  cy.mount(
    <ThemeProvider theme={theme}>
      <ToolCallForm initialArgs={initialArgs} busy={busy} onRun={cy.stub().as('run')} />
    </ThemeProvider>,
  );

describe('ToolCallForm', () => {
  it('runs the tool with the example arguments as they stand', () => {
    mount('{\n  "page": 1\n}');
    cy.contains('button', 'Run tool').click();
    cy.get('@run').should('have.been.calledWith', { page: 1 });
  });

  it('asks for {} when the arguments are cleared', () => {
    mount('{}');
    cy.get('textarea[name="args"]').clear();
    cy.contains('button', 'Run tool').click();
    cy.contains('or {} when the tool takes none').should('be.visible');
    cy.get('@run').should('not.have.been.called');
  });

  it('refuses arguments that are not one JSON object', () => {
    mount('{}');
    cy.get('textarea[name="args"]').clear().type('[1, 2]');
    cy.contains('button', 'Run tool').click();
    cy.contains('as one JSON object').should('be.visible');
    cy.get('@run').should('not.have.been.called');
  });

  it('runs edited arguments', () => {
    mount('{}');
    cy.get('textarea[name="args"]').clear().type('{{}"id": "L-1"}');
    cy.contains('button', 'Run tool').click();
    cy.get('@run').should('have.been.calledWith', { id: 'L-1' });
  });

  it('cannot run while a run is under way', () => {
    mount('{}', true);
    cy.contains('button', 'Run tool').should('be.disabled');
  });
});
