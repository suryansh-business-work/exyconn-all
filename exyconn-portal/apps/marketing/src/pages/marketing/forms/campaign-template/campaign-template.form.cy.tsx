import { MockedProvider } from '@apollo/client/testing/react';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { EditorMode, ListCampaignTemplatesDocument } from '@exyconn/shell/graphql/generated';
import { CampaignTemplateForm } from './campaign-template.form';

const TEMPLATES = {
  request: { query: ListCampaignTemplatesDocument },
  result: {
    data: {
      listCampaignTemplates: [
        {
          __typename: 'CampaignTemplate',
          id: 'tpl-1',
          name: 'Welcome',
          category: 'Onboarding',
          description: 'First email',
          editorMode: EditorMode.Visual,
          blocks: {},
          mjml: '<mjml></mjml>',
          version: 2,
          updatedByName: 'Asha Rao',
          updatedAt: '2026-09-02T09:30:00.000Z',
        },
      ],
    },
  },
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[TEMPLATES]}>
      <NotificationProvider>
        <main>
          <CampaignTemplateForm
            content={{ editorMode: EditorMode.Visual, blocks: {}, mjml: '<mjml></mjml>' }}
            onDone={cy.stub().as('done')}
            onCancel={cy.stub().as('cancel')}
          />
        </main>
      </NotificationProvider>
    </MockedProvider>,
  );

describe('CampaignTemplateForm', () => {
  it('needs a name and a category', () => {
    mount();
    cy.get('input[name="category"]').clear();
    cy.contains('button', 'Save template').click();
    cy.contains('Name the template').should('be.visible');
    cy.contains('Choose or type a category').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('caps the name at 120 characters', () => {
    mount();
    cy.get('input[name="name"]').type('n'.repeat(121), { delay: 0 });
    cy.contains('button', 'Save template').click();
    cy.contains('Keep the name under 120 characters').should('be.visible');
  });

  it('fills in an existing template when saving a new version of it', () => {
    mount();
    cy.get('input[name="templateId"]').parent().find('[role="combobox"]').click();
    cy.get('ul[role="listbox"]').contains('li', 'New version of “Welcome”').click();
    cy.get('input[name="name"]').should('have.value', 'Welcome');
    cy.get('input[name="category"]').should('have.value', 'Onboarding');
    cy.get('textarea[name="description"]').should('have.value', 'First email');
  });

  it('calls onCancel', () => {
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
