import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { UpdateEmailPreferencesDocument } from '@exyconn/shell/graphql/generated';
import { EmailPreferencesForm } from './email-preferences.form';
import type { EmailPreferences } from './email-preferences.types';

const preferences: EmailPreferences = {
  __typename: 'PublicEmailPreferences',
  email: 'asha@example.com',
  preview: false,
  unsubscribedAll: false,
  categories: [
    {
      __typename: 'PublicPreferenceCategory',
      id: 'news',
      name: 'Newsletter',
      description: 'Monthly news',
      subscribed: true,
    },
    {
      __typename: 'PublicPreferenceCategory',
      id: 'offers',
      name: 'Offers',
      description: '',
      subscribed: true,
    },
  ],
};

const saved = (unsubscribeAll: boolean, optedOut: string[]) => ({
  request: {
    query: UpdateEmailPreferencesDocument,
    variables: (vars: Record<string, unknown>) =>
      vars.token === 'tok-1' &&
      vars.unsubscribeAll === unsubscribeAll &&
      JSON.stringify(vars.optedOutCategoryIds) === JSON.stringify(optedOut),
  },
  result: {
    data: {
      updateEmailPreferences: {
        ...preferences,
        unsubscribedAll: unsubscribeAll,
        categories: preferences.categories.map((c) => ({
          ...c,
          subscribed: !optedOut.includes(c.id),
        })),
      },
    },
  },
});

const refused = {
  request: { query: UpdateEmailPreferencesDocument, variables: () => true },
  error: new Error('This link has expired'),
};

const mount = (mocks: ReadonlyArray<object>, prefs: EmailPreferences = preferences) =>
  cy.mount(
    <MockedProvider mocks={mocks as never}>
      <ThemeProvider theme={theme}>
        <main>
          <EmailPreferencesForm
            token="tok-1"
            preferences={prefs}
            onSaved={cy.stub().as('onSaved')}
            onError={cy.stub().as('onError')}
          />
        </main>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('EmailPreferencesForm', () => {
  it('shows each category switched on with its description', () => {
    mount([]);
    cy.contains('Monthly news').should('be.visible');
    cy.get('input[name="subscribed.news"]').should('be.checked');
    cy.get('input[name="subscribed.offers"]').should('be.checked');
    cy.get('input[name="unsubscribeAll"]').should('not.be.checked');
  });

  it('saves the categories switched off', () => {
    mount([saved(false, ['offers'])]);
    cy.get('input[name="subscribed.offers"]').click();
    cy.contains('button', 'Save preferences').click();
    cy.get('@onSaved').should('have.been.calledWithMatch', 'Your preferences are saved.');
  });

  it('warns before unsubscribing from everything and confirms it', () => {
    mount([saved(true, [])]);
    cy.get('input[name="unsubscribeAll"]').click();
    cy.contains('stop receiving every marketing email').should('be.visible');
    cy.contains('button', 'Save preferences').click();
    cy.get('@onSaved').should(
      'have.been.calledWithMatch',
      'You have been unsubscribed from all marketing emails.',
    );
  });

  it('reports a refused save', () => {
    mount([refused]);
    cy.contains('button', 'Save preferences').click();
    cy.get('@onError').should('have.been.calledWith', 'This link has expired');
  });

  it('explains when there are no categories', () => {
    mount([], { ...preferences, categories: [] });
    cy.contains('There are no separate email categories').should('be.visible');
  });

  it('cancel restores the switches', () => {
    mount([]);
    cy.get('input[name="subscribed.news"]').click().should('not.be.checked');
    cy.contains('button', 'Cancel').click();
    cy.get('input[name="subscribed.news"]').should('be.checked');
  });
});
