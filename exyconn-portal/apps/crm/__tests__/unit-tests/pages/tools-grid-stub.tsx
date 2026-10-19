import type { ColDef } from 'ag-grid-community';

/** What a CRM tool page handed the shared server grid. */
export interface ToolsGridProps {
  columnDefs: ColDef[];
  fetchRows: (input: object) => Promise<unknown>;
  refreshSignal?: number;
  onRowClick?: (row: unknown) => void;
  context: { actions: object; formatDate: (value: string) => string };
  searchPlaceholder: string;
}

/** The props of the last grid rendered. */
export const toolsGrid: { props: ToolsGridProps | null } = { props: null };

/** The last grid's props; fails the test when no grid was rendered. */
export function toolsGridProps(): ToolsGridProps {
  if (!toolsGrid.props) throw new Error('No ServerDataGrid was rendered');
  return toolsGrid.props;
}

/** Stands in for ServerDataGrid: keeps its props and shows the search hint it was given. */
export function ToolsGridStub(props: Readonly<ToolsGridProps>) {
  toolsGrid.props = props;
  return <p>{props.searchPlaceholder}</p>;
}
