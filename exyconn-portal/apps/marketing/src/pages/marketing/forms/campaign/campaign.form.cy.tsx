import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { I18nProvider } from '@exyconn/i18n';
import { Button } from '@exyconn/shell/components/ui';
import { SetupStep } from './steps/SetupStep';
import { useCampaignForm } from './studio/useCampaignForm';
import { STEP_FIELDS } from './campaign.types';
import type { StudioOptions } from './studio/useStudioOptions';

const OPTIONS: StudioOptions = {
  verifiedSenders: ['hello@exyconn.com'],
  variables: [],
  categories: [],
  loading: false,
  error: null,
};

/** The studio's own form around its setup step, with the check the Next button runs. */
function SetupHarness() {
  const methods = useCampaignForm(null);
  const [result, setResult] = useState('');
  const check = () => {
    methods
      .trigger(STEP_FIELDS.setup)
      .then((valid) =>
        setResult(
          JSON.stringify({ valid, budget: methods.getValues(['budget', 'budgetCurrency']) }),
        ),
      )
      .catch((err: unknown) => setResult(String(err)));
  };
  return (
    <FormProvider {...methods}>
      <SetupStep options={OPTIONS} campaign={null} />
      <Button onClick={check}>Check setup</Button>
      <output aria-label="Result">{result}</output>
    </FormProvider>
  );
}

const mount = () =>
  cy.mount(
    <I18nProvider locale="en" messages={{}} settings={{ currency: 'INR' }}>
      <main>
        <SetupHarness />
      </main>
    </I18nProvider>,
  );

const fillRequired = () => {
  cy.fieldLabel('Internal campaign name').parent().find('input').type('Diwali offer');
  cy.fieldLabel('Sender name').parent().find('input').type('Exyconn Team');
  cy.fieldLabel('Email subject').parent().find('input').type('Festive savings');
  cy.fieldLabel('Verified sender email').parent().find('[role="combobox"]').click();
  cy.contains('[role="option"]', 'hello@exyconn.com').click();
};

const amountInput = () => cy.fieldLabel('Budget amount').parent().find('input');
const currencyInput = () => cy.fieldLabel('Currency').parent().find('input');

const openAdvanced = () => cy.contains('button', 'Advanced settings').click();

describe('CampaignForm — budget in Campaign setup', () => {
  it('asks for the budget as an amount and a currency, the currency defaulting to the company one', () => {
    mount();
    openAdvanced();
    amountInput().should('have.attr', 'type', 'number');
    currencyInput().should('have.value', 'INR — Indian Rupee (₹)');
    cy.contains('Optional, for reporting what the campaign cost; 0 or more.').should('be.visible');
  });

  it('saves the amount typed with the currency picked', () => {
    mount();
    fillRequired();
    openAdvanced();
    amountInput().clear().type('2500');
    currencyInput().clear().type('USD');
    cy.contains('[role="option"]', /^USD — /).click();
    cy.contains('button', 'Check setup').click();
    cy.get('output[aria-label="Result"]').should(
      'have.text',
      JSON.stringify({ valid: true, budget: ['2500', 'USD'] }),
    );
  });

  it('refuses a negative budget before moving on', () => {
    mount();
    fillRequired();
    openAdvanced();
    amountInput().clear().type('-5');
    cy.contains('button', 'Check setup').click();
    cy.contains('The budget cannot be negative').should('be.visible');
    cy.get('output[aria-label="Result"]').should('contain', '"valid":false');
  });

  it('refuses a budget with no currency', () => {
    mount();
    fillRequired();
    openAdvanced();
    currencyInput().clear().blur();
    cy.contains('button', 'Check setup').click();
    cy.contains('Currency is required').should('be.visible');
  });
});
