import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  CreateColdEmailDraftDocument,
  FirecrawlReadyDocument,
} from '@exyconn/shell/graphql/generated';
import { ColdEmailDraftForm } from './cold-email-draft.form';
import type { ColdEmailDraftTarget } from './cold-email-draft.types';

const ACME: ColdEmailDraftTarget = {
  object: 'COMPANY',
  id: 'co-1',
  name: 'Acme',
  emails: ['hello@acme.com', 'sales@acme.com'],
  website: 'acme.com',
};

const firecrawl = (ready: boolean): MockLink.MockedResponse => ({
  request: { query: FirecrawlReadyDocument },
  result: { data: { firecrawlReady: ready } },
});

interface DraftInput {
  recordId: string;
  toEmail: string;
  goal: string;
  readWebsite: boolean;
}

const created: MockLink.MockedResponse = {
  request: {
    query: CreateColdEmailDraftDocument,
    variables: ({ input }: { input: DraftInput }) =>
      input.recordId === 'co-1' &&
      input.toEmail === 'sales@acme.com' &&
      input.goal === 'A free checkout audit' &&
      input.readWebsite,
  },
  result: {
    data: {
      createColdEmailDraft: {
        __typename: 'ColdEmailDraft',
        id: 'draft-1',
        object: 'COMPANY',
        recordId: 'co-1',
        recordName: 'Acme',
        toEmail: 'sales@acme.com',
        status: 'DRAFT',
        variantCount: 4,
        maxVariants: 10,
        createdByName: 'Priya',
        updatedAt: '2026-10-20T10:00:00.000Z',
        goal: 'A free checkout audit',
        tone: 'FRIENDLY',
        createdAt: '2026-10-20T10:00:00.000Z',
        variants: [],
      },
    },
  },
};

const failed: MockLink.MockedResponse = {
  request: { query: CreateColdEmailDraftDocument, variables: () => true },
  error: new Error('AI budget spent'),
};

const mount = (mocks: MockLink.MockedResponse[], target: ColdEmailDraftTarget = ACME) => {
  globalThis.localStorage.clear();
  return cy.mount(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <ColdEmailDraftForm
            target={target}
            onCreated={cy.stub().as('created')}
            onCancel={cy.stub().as('cancel')}
          />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );
};

describe('ColdEmailDraftForm', () => {
  it('warns about a record with no address and will not generate', () => {
    mount([firecrawl(true)], { ...ACME, emails: [] });
    cy.contains('Acme has no email address yet. Add one to the record first.').should('be.visible');
    cy.contains('button', 'Generate').click();
    cy.contains('Choose who it goes to').should('be.visible');
    cy.get('@created').should('not.have.been.called');
  });

  it('keeps what is offered under the limit', () => {
    mount([firecrawl(false)]);
    cy.get('textarea[name="goal"]').type('x'.repeat(1001), { delay: 0 }).blur();
    cy.contains('Keep what you are offering under 1000 characters').should('be.visible');
  });

  it('explains why the website cannot be read when Firecrawl is not set up', () => {
    mount([firecrawl(false)]);
    cy.contains('Reading their website needs a website on the record').should('be.visible');
    cy.contains('Read their website first').should('not.exist');
  });

  it('drafts to the chosen address, reading the website first, and opens the draft', () => {
    mount([firecrawl(true), created]);
    cy.get('[role="combobox"]').first().click();
    cy.contains('li[role="option"]', 'sales@acme.com').click();
    cy.get('textarea[name="goal"]').type('A free checkout audit');
    cy.contains('label', 'Read their website first').click();
    cy.contains('Reads acme.com through Firecrawl').should('be.visible');
    cy.contains('button', 'Generate').click();
    cy.get('@created').should('have.been.calledWith', 'draft-1');
    cy.contains('Cold email drafted').should('be.visible');
  });

  it('says why the AI could not draft and stays open', () => {
    mount([firecrawl(false), failed]);
    cy.contains('button', 'Generate').click();
    cy.contains('AI budget spent').should('be.visible');
    cy.get('@created').should('not.have.been.called');
  });

  it('calls onCancel', () => {
    mount([firecrawl(false)]);
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
