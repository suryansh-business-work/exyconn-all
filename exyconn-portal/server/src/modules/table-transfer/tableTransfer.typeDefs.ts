import gql from 'graphql-tag';

export const tableTransferTypeDefs = gql`
  enum TableFileFormat {
    CSV
    XLSX
  }

  "What an import does with a row whose match column names an existing record."
  enum TableImportMode {
    "Every row becomes a new record."
    CREATE
    "Rows update the record they match; a row matching none is skipped."
    UPDATE
    "Rows update the record they match, and become new records when they match none."
    UPSERT
  }

  enum TableFieldKind {
    TEXT
    NUMBER
    BOOLEAN
    DATE
    ENUM
    LIST
    OBJECT
  }

  "One exported column: the row field it reads (dotted for a nested one, e.g. customer.name) and its heading."
  input TableExportColumnInput {
    field: String!
    header: String!
  }

  "A generated file, base64-encoded for the client to save."
  type TableFile {
    fileName: String!
    mimeType: String!
    contentBase64: String!
    rowCount: Int!
  }

  "One column an import may fill: a field of the module's create input."
  type TableImportField {
    field: String!
    required: Boolean!
    kind: TableFieldKind!
    "The accepted values of an enum field; empty otherwise."
    options: [String!]!
    description: String
  }

  "A column a grid may filter on, with the kind of filter its type takes."
  type TableFilterColumn {
    field: String!
    kind: TableFieldKind!
    "The values an enum column holds; empty otherwise."
    options: [String!]!
  }

  "What a grid may ask of a paged list: its filters, its sorts and whether it takes imports."
  type TableInfo {
    filters: [TableFilterColumn!]!
    sortFields: [String!]!
    importable: Boolean!
    "Fields that identify an existing record for UPDATE and UPSERT; empty means CREATE only."
    matchFields: [String!]!
    importFields: [TableImportField!]!
  }

  "An uploaded file read for import: its header row and data rows, blank rows kept in place."
  type ParsedTableFile {
    headers: [String!]!
    rows: [[String!]!]!
  }

  type TableImportIssue {
    "The row's line in the file."
    row: Int!
    message: String!
    "True when the row was left alone on purpose rather than refused."
    skipped: Boolean!
  }

  type TableImportResult {
    created: Int!
    updated: Int!
    skipped: Int!
    issues: [TableImportIssue!]!
  }

  "What a grid may do with the rows a person selects."
  enum TableBulkAction {
    "Deletes each row through the module's own delete, guards and audit included."
    DELETE
    "Hides the rows from the table and keeps them; they can be restored."
    ARCHIVE
    "Brings archived rows back into the table."
    RESTORE
  }

  type TableBulkInfo {
    deletable: Boolean!
    archivable: Boolean!
  }

  type TableBulkFailure {
    id: ID!
    message: String!
  }

  enum TableBulkJobStatus {
    QUEUED
    RUNNING
    DONE
    FAILED
  }

  "A bulk action to run in the background: on ticked rows, or on every row a list's query matches."
  input TableBulkJobInput {
    "The paged list the rows belong to. Leave empty for a client-side table and name the entity."
    list: String
    "The record type of a client-side table's rows, e.g. Holiday; it takes DELETE only."
    entity: String
    action: TableBulkAction!
    "The ticked rows. Leave empty, with variables, to act on every row the list's query matches."
    ids: [ID!]
    "The variables the list's own query loads pages with, for Select all matching."
    variables: JSON
  }

  "A bulk action working through its rows in the background, in chunks."
  type TableBulkJob {
    id: ID!
    action: TableBulkAction!
    status: TableBulkJobStatus!
    "Rows the job acts on; known once the matching rows are read."
    total: Int!
    processed: Int!
    succeeded: Int!
    failedCount: Int!
    "The first rows that could not be changed, with why."
    failures: [TableBulkFailure!]!
    "Why the whole job stopped, when it failed."
    error: String
  }

  extend type Query {
    "Whether a list's selected rows can be deleted and archived."
    tableBulkInfo(list: String!): TableBulkInfo!
    "A bulk job's progress, for the person who started it."
    tableBulkJob(id: ID!): TableBulkJob
    "Every row of a paged list under the given search, sort and filters, as one file. Needs EXPORT."
    tableExport(
      list: String!
      input: TableQueryInput!
      columns: [TableExportColumnInput!]!
      format: TableFileFormat!
      fileName: String!
    ): TableFile!
    "Reads what a paged list supports: the fields it can filter and sort on, and whether and how it takes imports."
    tableInfo("The paged query's name, for example listLeadsPaged." list: String!): TableInfo!
    "The sample file to fill in for an import into this list."
    tableImportTemplate(
      list: String!
      format: TableFileFormat!
      fileName: String!
      columns: [TableExportColumnInput!]
    ): TableFile!
  }

  extend type Mutation {
    "Reads an uploaded CSV or XLSX (up to 10 MB and 50,000 rows) for the import wizard."
    parseTableFile(fileName: String!, contentBase64: String!): ParsedTableFile!
    "Imports up to 500 mapped rows (field to cell text) through the module's own create and update."
    importTableRows(
      list: String!
      mode: TableImportMode!
      matchField: String
      rows: [JSON!]!
      firstRowNumber: Int!
    ): TableImportResult!
    "Queues a delete, archive or restore of up to 50,000 rows; the job reports its progress."
    startTableBulkJob(input: TableBulkJobInput!): TableBulkJob!
  }
`;
