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
});
