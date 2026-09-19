import { MockedProvider } from '@apollo/client/testing/react';
import { LocalizationProvider, AdapterDateFns } from '@exyconn/shell/components/ui';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { SocialPostForm } from './social-post.form';
import { ACCOUNTS, RULES, post } from '../../social.fixtures.cy';
import type { NetworkRule, SocialMediaPostRow } from './social-post.types';

const mount = (initial: SocialMediaPostRow | null = null) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <SocialPostForm
              accounts={ACCOUNTS as never}
              rules={RULES as unknown as NetworkRule[]}
              initial={initial}
              onDone={cy.stub()}
              onCancel={cy.stub().as('cancel')}
            />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('SocialPostForm', () => {
  it('asks for an account and something to post', () => {
    mount();
    cy.contains('button', 'Post').click();
    cy.contains('Choose at least one account').should('be.visible');
    cy.contains('Write something, or add an image').should('be.visible');
  });

  it('offers only accounts that take posts', () => {
    mount();
    cy.get('#mui-component-select-accountIds, [id^="accountIds"], div[role="combobox"]')
      .first()
      .click();
    cy.contains('[role="option"]', 'Exyconn · Facebook').should('exist');
    cy.contains('[role="option"]', 'Exyconn X · X').should('exist');
    cy.contains('[role="option"]', 'YouTube').should('not.exist');
  });

  it('asks for a time when scheduling', () => {
    mount();
    cy.get('input[name="timing"]').siblings('[role="combobox"]').click();
    cy.contains('[role="option"]', 'Schedule for later').click();
    cy.contains('label', 'Publish at').should('be.visible');
    cy.contains('button', 'Post').click();
    cy.contains('Pick a time in the future').should('be.visible');
  });

  it('edits a stored post without choosing accounts again', () => {
    mount(
      post('p1', { origin: 'COMPOSED', status: 'DRAFT', accountId: 'x1', network: 'X' }) as never,
    );
    cy.contains('label', 'Post to').should('not.exist');
    cy.get('textarea[name="text"]').should('have.value', 'Post p1');
    cy.contains('X 7/280').should('be.visible');
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
