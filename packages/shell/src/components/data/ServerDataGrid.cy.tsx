import type { ColDef } from 'ag-grid-community';
import type { TableQueryInput } from '@/graphql/generated';
import ServerDataGridImpl, { type TablePageResult } from './ServerDataGrid.impl';
import { SEARCH_DEBOUNCE_MS } from './serverGridQuery';

/** Long enough for any debounced reload to have fired, so a spec can assert it did not. */
const PAST_DEBOUNCE_MS = SEARCH_DEBOUNCE_MS + 200;

interface Row {
  id: string;
  name: string;
}

const columnDefs: ColDef<unknown>[] = [{ field: 'name', headerName: 'Name' }];
const page: TablePageResult<unknown> = {
  rows: [
    { id: '1', name: 'Alpha' },
    { id: '2', name: 'Beta' },
  ] satisfies Row[],
  totalCount: 2,
};

/** A fetchRows whose promise the spec settles by hand, so it can inspect the loading state. */
function deferredFetch() {
  const pending: Array<(value: TablePageResult<unknown>) => void> = [];
  const fetchRows = cy
    .stub()
    .as('fetchRows')
    .callsFake(
      (_input: TableQueryInput) =>
        new Promise<TablePageResult<unknown>>((resolve) => {
          pending.push(resolve);
        }),
    );
  const settleAll = () => {
    for (const resolve of pending.splice(0)) {
      resolve(page);
    }
  };
  return { fetchRows, settleAll };
}

describe('ServerDataGrid', () => {
  it('shows skeleton rows and locks the grid until the page arrives', () => {
    const { fetchRows, settleAll } = deferredFetch();
    cy.mount(<ServerDataGridImpl columnDefs={columnDefs} fetchRows={fetchRows} height={400} />);

    cy.get('[data-testid="grid-skeleton-cell"]').should('exist');
    cy.get('[aria-busy="true"]').should('have.attr', 'inert');
    cy.get('[aria-label="Refresh table"]').should('be.disabled');

    cy.then(settleAll);
    cy.contains('Alpha').should('be.visible');
    cy.get('[data-testid="grid-skeleton-cell"]').should('not.exist');
    cy.get('[aria-label="Refresh table"]').should('be.enabled');
    // Mounting loads the first page once — the empty search box must not trigger a second.
    cy.wait(PAST_DEBOUNCE_MS);
    cy.get('@fetchRows').should('have.been.calledOnce');
  });

  it('reloads from the server when Refresh is pressed', () => {
    const fetchRows = cy.stub().as('fetchRows').resolves(page);
    cy.mount(<ServerDataGridImpl columnDefs={columnDefs} fetchRows={fetchRows} height={400} />);
    cy.contains('Alpha').should('be.visible');

    cy.get('[aria-label="Refresh table"]').click();
    cy.get('@fetchRows').should('have.been.calledTwice');
  });

  it('debounces the search box into a single server query', () => {
    const fetchRows = cy.stub().as('fetchRows').resolves(page);
    cy.mount(<ServerDataGridImpl columnDefs={columnDefs} fetchRows={fetchRows} height={400} />);
    cy.contains('Alpha').should('be.visible');

    cy.get('input[aria-label="Search…"]').type('  alp ');
    cy.wait(PAST_DEBOUNCE_MS);
    cy.get('@fetchRows').should('have.been.calledTwice');
    cy.get('@fetchRows')
      .its('lastCall.args.0')
      .should('deep.include', { search: 'alp', page: 0, pageSize: 25 });
  });

  it('tells the user when a page fails to load', () => {
    const fetchRows = cy.stub().rejects(new Error('Network down'));
    cy.mount(<ServerDataGridImpl columnDefs={columnDefs} fetchRows={fetchRows} height={400} />);
    cy.contains('Could not load the rows (Network down). Use Refresh to try again.').should(
      'be.visible',
    );
    cy.get('[aria-label="Refresh table"]').should('be.enabled');
  });
});
