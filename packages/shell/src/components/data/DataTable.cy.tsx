import { DataTable, type Column } from './DataTable';

interface Row {
  id: string;
  name: string;
}

const rows: Row[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
];
const columns: Column<Row>[] = [{ key: 'name', label: 'Name' }];

describe('DataTable', () => {
  it('renders the column header and rows', () => {
    cy.mount(<DataTable columns={columns} rows={rows} />);
    cy.contains('th', 'Name').should('be.visible');
    cy.contains('Alpha').should('be.visible');
    cy.contains('Beta').should('be.visible');
  });

  it('shows the empty message when there are no rows', () => {
    cy.mount(<DataTable columns={columns} rows={[]} emptyMessage="Nothing here yet." />);
    cy.contains('Nothing here yet.').should('be.visible');
  });

  it('fires edit and delete callbacks for a row', () => {
    cy.mount(
      <DataTable
        columns={columns}
        rows={rows}
        onEdit={cy.stub().as('edit')}
        onDelete={cy.stub().as('delete')}
      />,
    );
    cy.get('[aria-label="edit"]').first().click();
    cy.get('@edit').should('have.been.called');
    cy.get('[aria-label="delete"]').first().click();
    cy.get('@delete').should('have.been.called');
  });

  it('draws skeleton rows instead of data and actions while loading', () => {
    cy.mount(
      <DataTable
        columns={columns}
        rows={rows}
        loading
        onEdit={cy.stub()}
        emptyMessage="Nothing here yet."
      />,
    );
    cy.contains('th', 'Name').should('be.visible');
    cy.get('[data-testid="table-skeleton-row"]').should('have.length', 5);
    cy.contains('Alpha').should('not.exist');
    cy.get('[aria-label="edit"]').should('not.exist');
    cy.contains('Nothing here yet.').should('not.exist');
  });

  it('refreshes on demand and disables the button while loading', () => {
    const onRefresh = cy.stub().as('refresh').resolves(undefined);
    cy.mount(<DataTable columns={columns} rows={rows} onRefresh={onRefresh} />);
    cy.get('[aria-label="Refresh table"]').click();
    cy.get('@refresh').should('have.been.calledOnce');

    cy.mount(<DataTable columns={columns} rows={rows} onRefresh={onRefresh} loading />);
    cy.get('[aria-label="Refresh table"]').should('be.disabled');
  });

  it('keeps the refresh button on an empty table', () => {
    cy.mount(<DataTable columns={columns} rows={[]} onRefresh={cy.stub().resolves(undefined)} />);
    cy.contains('No records yet.').should('be.visible');
    cy.get('[aria-label="Refresh table"]').should('be.enabled');
  });
});
