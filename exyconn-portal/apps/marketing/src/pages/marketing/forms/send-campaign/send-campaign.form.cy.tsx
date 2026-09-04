import { MockedProvider } from '@apollo/client/testing';
import { SendCampaignForm } from './send-campaign.form';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import type { SendCampaignTarget } from './send-campaign.types';

const campaign = {
  id: '1',
  name: 'Summer Sale',
  subject: 'Big summer discounts',
  body: 'Hello, enjoy our summer offers.',
} as unknown as SendCampaignTarget;

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]} addTypename={false}>
      <NotificationProvider>
        <SendCampaignForm
          campaign={campaign}
          onDone={cy.stub()}
          onCancel={cy.stub().as('cancel')}
        />
      </NotificationProvider>
    </MockedProvider>,
  );

describe('SendCampaignForm', () => {
  it('requires an audience', () => {
    mount();
    cy.contains('button', 'Send').click();
    cy.contains('Choose the audience to send to').should('be.visible');
  });

  it('says when there are no audiences to send to', () => {
    mount();
    cy.contains('No audiences yet — create one first.').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
