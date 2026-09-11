import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { theme } from '@exyconn/shell/config/theme';
import { AssetCategory, AssetStatus } from '@exyconn/shell/graphql/generated';
import { AssetNotesForm } from './asset-notes.form';
import type { AssetNotesRow } from './asset-notes.types';

const ASSET: AssetNotesRow = {
  __typename: 'Asset',
  id: 'asset-1',
  assetTag: 'EXY-0001',
  name: 'MacBook Pro 14',
  category: AssetCategory.Laptop,
  status: AssetStatus.InStock,
  manufacturer: 'Apple',
  modelName: 'A2442',
  serialNumber: 'C02X',
  assignedToId: '',
  assignedToName: '',
  location: 'Pune',
  purchaseDate: null,
  warrantyExpiry: null,
  purchaseCost: 0,
  notes: 'Battery replaced in March.',
};

const mount = () =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <AssetNotesForm asset={ASSET} onDone={cy.stub()} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('AssetNotesForm', () => {
  it('opens with the notes already on the asset', () => {
    mount();
    cy.get('textarea[name="notes"]').should('have.value', 'Battery replaced in March.');
  });

  it('puts the saved notes back when the edit is cancelled', () => {
    mount();
    cy.get('textarea[name="notes"]').clear().type('Screen is cracked');
    cy.contains('button', 'Cancel').click();
    cy.get('textarea[name="notes"]').should('have.value', 'Battery replaced in March.');
  });
});
