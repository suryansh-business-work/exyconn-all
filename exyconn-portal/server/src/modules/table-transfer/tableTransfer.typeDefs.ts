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

  type TableBulkResult {
    succeeded: Int!
    "Rows that could not be deleted, with why; the rest were."
    failures: [TableBulkFailure!]!
  }

  extend type Query {
    "Whether a list's selected rows can be deleted and archived."
    tableBulkInfo(list: String!): TableBulkInfo!
    "Every row of a paged list under the given search, sort and filters, as one file. Needs EXPORT."
    tableExport(
      list: String!
      input: TableQueryInput!
      columns: [TableExportColumnInput!]!
      format: TableFileFormat!
      fileName: String!
    ): TableFile!
    tableInfo(list: String!): TableInfo!
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
    "Deletes, archives or restores up to 200 selected rows of a list."
    tableBulkAction(list: String!, ids: [ID!]!, action: TableBulkAction!): TableBulkResult!
  }
`;
