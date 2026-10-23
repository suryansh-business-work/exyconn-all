import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { NearFilterForm } from './near-filter.form';
import type { NearFilter } from './near-filter.types';

const mount = (near: NearFilter | null = null) =>
  cy.mount(
    <MockedProvider mocks={[]}>
      <ThemeProvider theme={theme}>
        <NearFilterForm
          near={near}
          onApply={cy.stub().as('apply')}
          onClear={cy.stub().as('clear')}
          onCancel={cy.stub().as('cancel')}
        />
      </ThemeProvider>
    </MockedProvider>,
  );

describe('NearFilterForm', () => {
  it('needs a centre before it applies', () => {
    mount();
    cy.contains('button', 'Apply').click();
    cy.contains('Enter the latitude, or use your location or a place').should('be.visible');
    cy.contains('Enter the longitude, or use your location or a place').should('be.visible');
    cy.get('@apply').should('not.have.been.called');
  });

  it('refuses coordinates out of range', () => {
    mount();
    cy.get('input[name="lat"]').type('91');
    cy.get('input[name="lng"]').type('-181');
    cy.contains('button', 'Apply').click();
    cy.contains('Latitude is from -90 to 90').should('be.visible');
    cy.contains('Longitude is from -180 to 180').should('be.visible');
  });

  it('applies typed coordinates with the default radius', () => {
    mount();
    cy.get('input[name="lat"]').type('12.9716');
    cy.get('input[name="lng"]').type('77.5946');
    cy.contains('button', 'Apply').click();
    cy.get('@apply').should('have.been.calledWith', {
      lat: 12.9716,
      lng: 77.5946,
      radiusKm: 10,
      label: '',
    });
  });

  it('removes a filter in place, or cancels', () => {
    mount({ lat: 1, lng: 2, radiusKm: 5, label: 'Koramangala' });
    cy.contains('button', 'Remove filter').click();
    cy.get('@clear').should('have.been.calledOnce');
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.calledOnce');
  });
});
