import type { ComponentType } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';
import {
  DOCUMENT_COLUMNS,
  type PagedLegalDocumentRow,
} from '../../../../src/pages/legal/document-grid';
import { PDF_ACTION, WORD_ACTION } from '../../../../src/pages/legal/download-actions';
import { renderWithProviders } from '../../test-utils';
import { documentRow } from './legal.fixtures';

type Formatter = (params: ValueFormatterParams<PagedLegalDocumentRow>) => string;
type CellParams = ICellRendererParams<PagedLegalDocumentRow>;

const column = (id: string): ColDef<PagedLegalDocumentRow> => {
  const found = DOCUMENT_COLUMNS.find((col) => (col.colId ?? col.field) === id);
  if (!found) {
    throw new Error(`No column ${id}`);
  }
  return found;
};

const shownOwner = (data: PagedLegalDocumentRow) =>
  (column('owner').valueFormatter as Formatter)({
    data,
    context: { t: (source: string) => source },
  } as ValueFormatterParams<PagedLegalDocumentRow>);

/** Renders the Link column's cell for a row, inside a parent that records row clicks. */
function renderLinkCell(data: PagedLegalDocumentRow | undefined, onRowClick = vi.fn()) {
  const Cell = column('fileUrl').cellRenderer as ComponentType<CellParams>;
  const params = { data } as CellParams;
  return renderWithProviders(
    <div data-testid="row" onClick={onRowClick} role="presentation">
      <Cell {...params} />
    </div>,
  );
}

describe('DOCUMENT_COLUMNS', () => {
  it('lists the repository columns, then the row actions', () => {
    expect(DOCUMENT_COLUMNS.map((col) => col.colId ?? col.field)).toEqual([
      'title',
      'category',
      'owner',
      'status',
      'fileUrl',
      'actions',
    ]);
  });

  it('shows the owner, or a dash for a document nobody owns', () => {
    expect(shownOwner(documentRow())).toBe('Legal team');
    expect(shownOwner(documentRow({ owner: null }))).toBe('—');
  });

  it('keeps the Link column out of sorting and filtering', () => {
    expect(column('fileUrl')).toMatchObject({
      headerName: 'Link',
      sortable: false,
      filter: false,
      floatingFilter: false,
    });
  });

  it('offers edit, both downloads and delete, in that order', () => {
    const specs = column('actions').cellRendererParams.actionSpecs as RowActionSpec[];
    expect(specs.map((spec) => spec.key)).toEqual(['edit', 'pdf', 'docx', 'delete']);
    expect(specs[1]).toBe(PDF_ACTION);
    expect(specs[2]).toBe(WORD_ACTION);
  });
});

describe('the Link cell', () => {
  it('renders nothing while the row is still loading', () => {
    renderLinkCell(undefined);
    expect(screen.getByTestId('row')).toBeEmptyDOMElement();
  });

  it('shows a dash for a document with no file', () => {
    renderLinkCell(documentRow({ fileUrl: null }));
    expect(screen.getByTestId('row')).toHaveTextContent('—');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('opens the file in a new tab without opening the row', () => {
    const onRowClick = vi.fn();
    renderLinkCell(documentRow(), onRowClick);
    const link = screen.getByRole('link', { name: 'Open' });
    expect(link).toHaveAttribute('href', 'https://cdn.example.com/dpa.pdf');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');

    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
