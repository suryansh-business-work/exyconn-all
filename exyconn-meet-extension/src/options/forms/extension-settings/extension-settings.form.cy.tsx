import { DEFAULT_PREFS } from '../../../storage/prefs';
import { ExtensionSettingsForm } from './extension-settings.form';
import type { ExtensionOrgSwitches, ExtensionSettingsFormProps } from './extension-settings.types';

const ORG: ExtensionOrgSwitches = {
  participantTracking: true,
  liveTranscript: true,
  remindersEnabled: true,
  reminderIntervalMinutes: 2,
};

function mount(overrides: Partial<ExtensionSettingsFormProps> = {}) {
  const onSave = cy.stub().as('save').resolves();
  cy.mount(
    <ExtensionSettingsForm initial={DEFAULT_PREFS} org={ORG} onSave={onSave} {...overrides} />,
  );
}

describe('ExtensionSettingsForm', () => {
  it('saves the defaults unchanged', () => {
    mount();
    cy.contains('button', 'Save settings').click();
    cy.get('@save').should('have.been.calledOnceWith', DEFAULT_PREFS);
    cy.contains('Settings saved').should('be.visible');
  });

  it('validates the snooze length', () => {
    mount();
    cy.get('input[name="snoozeMinutes"]').clear().type('2').blur();
    cy.contains('Snooze for at least 5 minutes').should('be.visible');
    cy.get('input[name="snoozeMinutes"]').clear().type('500').blur();
    cy.contains('Snooze for at most 120 minutes').should('be.visible');
    cy.get('input[name="snoozeMinutes"]').clear().blur();
    cy.contains('Enter a number of minutes').should('be.visible');
    cy.contains('button', 'Save settings').click();
    cy.get('@save').should('not.have.been.called');
  });

  it('saves a changed theme and reminder interval', () => {
    mount();
    cy.get('#theme').click();
    cy.contains('li', 'Dark').click();
    cy.get('#reminderInterval').click();
    cy.contains('li', 'Every 5 minutes').click();
    cy.contains('button', 'Save settings').click();
    cy.get('@save').should('have.been.calledWithMatch', { theme: 'dark', reminderInterval: '5' });
  });

  it('shows the company default interval', () => {
    mount();
    cy.get('#reminderInterval').should('contain.text', 'Company default (2 min)');
  });

  it('saves the microphone switch once turned on', () => {
    mount();
    cy.get('input[name="captureMicrophone"]').click().should('be.checked');
    cy.contains('button', 'Save settings').click();
    cy.get('@save').should('have.been.calledWithMatch', { captureMicrophone: true });
  });

  it('locks switches the company has turned off', () => {
    mount({ org: { ...ORG, participantTracking: false, liveTranscript: false } });
    cy.get('input[name="participantTracking"]').should('be.disabled');
    cy.get('input[name="liveTranscript"]').should('be.disabled');
    cy.contains('Turned off by your company').should('be.visible');
  });

  it('shows a save failure', () => {
    mount({ onSave: cy.stub().rejects(new Error('Could not save settings')) });
    cy.contains('button', 'Save settings').click();
    cy.contains('Could not save settings').should('be.visible');
  });

  it('resets to the defaults', () => {
    mount({ initial: { ...DEFAULT_PREFS, theme: 'dark' } });
    cy.contains('button', 'Reset to defaults').click();
    cy.contains('button', 'Save settings').click();
    cy.get('@save').should('have.been.calledWithMatch', { theme: 'system' });
  });
});
