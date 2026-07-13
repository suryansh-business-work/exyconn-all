import { MockedProvider } from '@apollo/client/testing';
import { SendCampaignForm } from './send-campaign.form';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
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
  it('requires at least one recipient', () => {
    mount();
    cy.contains('button', 'Send').click();
    cy.contains('Select at least one client').should('be.visible');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
