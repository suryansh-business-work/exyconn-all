import type { ApolloClient } from '@apollo/client';
import type { CsvColumn } from '@exyconn/shell/utils/csv';

/** One report: how to load every row, and the columns used for both the table and the CSV. */
export interface ReportDef<Row> {
  key: string;
  label: string;
  description: string;
  columns: CsvColumn<Row>[];
  load: (client: ApolloClient<object>) => Promise<Row[]>;
}

/** Row type erased so a heterogeneous list of reports can be rendered by one page. */
export interface AnyReport {
  key: string;
  label: string;
  description: string;
  columns: CsvColumn<unknown>[];
  load: (client: ApolloClient<object>) => Promise<unknown[]>;
}

/** Keeps each report fully typed at its definition; the one cast lives here. */
export function defineReport<Row>(def: ReportDef<Row>): AnyReport {
  return def as unknown as AnyReport;
}
