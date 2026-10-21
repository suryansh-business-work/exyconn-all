import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { MaReleaseChannel } from '@exyconn/shell/graphql/generated';
import { ReleaseChannelForm } from './release-channel.form';

const mount = (saved: boolean) =>
  cy.mount(
    <ThemeProvider theme={theme}>
      <ReleaseChannelForm
        defaultChannel={MaReleaseChannel.Stable}
        submitLabel="Approve and publish"
        onSubmit={cy.stub().as('submit').resolves(saved)}
        onDone={cy.stub().as('done')}
        onCancel={cy.stub().as('cancel')}
      />
    </ThemeProvider>,
  );

describe('ReleaseChannelForm', () => {
  it('starts on the default channel and submits it', () => {
    mount(true);
    cy.get('input[name="channel"]').should('have.value', MaReleaseChannel.Stable);
    cy.contains('Stable reaches every company').should('be.visible');
    cy.contains('button', 'Approve and publish').click();
    cy.get('@submit').should('have.been.calledOnceWith', MaReleaseChannel.Stable);
    cy.get('@done').should('have.been.calledOnce');
  });

  it('submits the channel picked instead', () => {
    mount(true);
    cy.get('[role="combobox"]').click();
    cy.contains('[role="option"]', 'Beta').click();
    cy.contains('button', 'Approve and publish').click();
    cy.get('@submit').should('have.been.calledOnceWith', MaReleaseChannel.Beta);
  });

  it('stays open when saving fails', () => {
    mount(false);
    cy.contains('button', 'Approve and publish').click();
    cy.get('@submit').should('have.been.calledOnce');
    cy.get('@done').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount(true);
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.calledOnce');
    cy.get('@submit').should('not.have.been.called');
  });
});
