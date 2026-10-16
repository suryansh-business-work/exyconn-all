import type { TableFileFormat } from '@exyconn/shell/graphql/generated';

/** One thing a column of the file can be imported as. */
export interface ImportFieldOption {
  key: string;
  /** Shown in the mapping select, already translated. */
  label: string;
  required: boolean;
  /** A heading the options are grouped under in the select (Built-in, Custom…). */
  group?: string;
  /** What a value looks like, shown beside the label (Number, Date…), already translated. */
  typeLabel?: string;
  /** Other headings a file may give this field; matched as well as the key and label. */
  aliases?: readonly string[];
}

/** What matching rows are imported as: create new, update existing, or both. */
export interface ImportModeOption<Mode extends string> {
  mode: Mode;
  /** English copy, translated by the wizard. */
  label: string;
}

/** A file read for import: its header row, then its data rows (blank ones kept in place). */
export interface ImportFile {
  name: string;
  headers: string[];
  rows: string[][];
}

/** A mapped row as the importer takes it: field key to the trimmed cell text. */
export type ImportRow = Record<string, string>;

export interface ImportIssue {
  /** The row's line in the file. */
  row: number;
  message: string;
  /** Left alone on purpose (an update that matched nothing) rather than refused. */
  skipped: boolean;
}

/** What the server did with one chunk of rows. */
export interface ImportChunkResult {
  created: number;
  updated: number;
  skipped: number;
  issues: readonly ImportIssue[];
}

/**
 * Everything the import wizard needs to know about where rows go. The wizard owns the steps,
 * the mapping and the progress; the source owns the fields and the writes.
 */
export interface ImportSource<Mode extends string> {
  /** The dialog title, already translated. */
  title: string;
  fields: readonly ImportFieldOption[];
  /** The choices for matching rows; the first is the default. */
  modes: readonly [ImportModeOption<Mode>, ...ImportModeOption<Mode>[]];
  /** The label of the field records are matched by, said on the options step. */
  matchLabel: string | null;
  /** Normalised headings (letters and digits) other tools write, to the field they mean. */
  synonyms?: Readonly<Record<string, string>>;
  /** Sends one chunk; `firstRowNumber` is the file line of its first row. */
  runChunk: (rows: ImportRow[], mode: Mode, firstRowNumber: number) => Promise<ImportChunkResult>;
  /** The sample file formats offered on the upload step. */
  templateFormats: readonly TableFileFormat[];
  downloadTemplate: (format: TableFileFormat) => Promise<void>;
  /** Why the fields could not be loaded, already translated; shown above the steps. */
  loadError?: string | null;
}
