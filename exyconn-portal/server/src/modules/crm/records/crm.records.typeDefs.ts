import gql from 'graphql-tag';

/**
 * The CRM's dynamic layer: each record type's properties (built-in and custom), HubSpot-style
 * filtered and sorted lists, saved views, custom properties and CSV import.
 */
export const crmRecordsTypeDefs = gql`
  enum CrmObject {
    LEAD
    COMPANY
    CONTACT
  }

  enum CrmPropertyType {
    TEXT
    "Several lines of text."
    TEXTAREA
    EMAIL
    PHONE
    URL
    NUMBER
    DATE
    "A dropdown: one of the choices."
    ENUM
    "Radio buttons: one of the choices, all shown at once."
    RADIO
    "Checkboxes: any number of the choices."
    MULTI_SELECT
    BOOLEAN
    "An uploaded file; the value is its address."
    FILE
  }

  "What a filter condition asks of a property; which ones apply depends on its type."
  enum CrmOp {
    EQ
    NEQ
    CONTAINS
    NOT_CONTAINS
    STARTS_WITH
    ENDS_WITH
    GT
    GTE
    LT
    LTE
    BETWEEN
    IN
    NOT_IN
    BEFORE
    AFTER
    LAST_DAYS
    IS_EMPTY
    IS_NOT_EMPTY
  }

  "CREATE skips rows that match an existing record, UPDATE skips rows that do not, UPSERT does both."
  enum CrmImportMode {
    CREATE
    UPDATE
    UPSERT
  }

  type CrmPropertyOption {
    value: String!
    label: String!
  }

  "One property of a record type, as lists, filters, import and export see it."
  type CrmPropertyInfo {
    key: String!
    label: String!
    type: CrmPropertyType!
    options: [CrmPropertyOption!]!
    required: Boolean!
    builtIn: Boolean!
    importable: Boolean!
    description: String!
    "The operators a filter on this property may use."
    ops: [CrmOp!]!
  }

  type CrmObjectSchema {
    object: CrmObject!
    "The property that identifies a record on import (email, or domain for a company)."
    dedupeKey: String!
    properties: [CrmPropertyInfo!]!
  }

  "A property a company added (CRM > Settings > Properties)."
  type CrmProperty {
    id: ID!
    object: CrmObject!
    key: String!
    label: String!
    type: CrmPropertyType!
    options: [CrmPropertyOption!]!
    required: Boolean!
    description: String!
    order: Int!
  }

  input CrmPropertyOptionInput {
    value: String!
    label: String!
  }

  input CrmPropertyInput {
    object: CrmObject!
    key: String!
    label: String!
    type: CrmPropertyType!
    options: [CrmPropertyOptionInput!]!
    required: Boolean!
    description: String!
  }

  "One new property for several record types at once: a row is made for each of objects."
  input CrmPropertiesInput {
    objects: [CrmObject!]!
    key: String!
    label: String!
    type: CrmPropertyType!
    options: [CrmPropertyOptionInput!]!
    required: Boolean!
    description: String!
  }

  "The key, type and record type of a property are fixed once it exists."
  input CrmPropertyUpdateInput {
    label: String!
    options: [CrmPropertyOptionInput!]!
    required: Boolean!
    description: String!
  }

  type CrmCondition {
    property: String!
    op: CrmOp!
    values: [String!]!
  }

  type CrmFilterGroup {
    conditions: [CrmCondition!]!
  }

  type CrmSort {
    property: String!
    dir: SortDir!
  }

  input CrmConditionInput {
    property: String!
    op: CrmOp!
    "Dates as ISO strings; BETWEEN takes two values, IN/NOT_IN any number."
    values: [String!]!
  }

  "Conditions in a group must all hold; a record matches when any group does."
  input CrmFilterGroupInput {
    conditions: [CrmConditionInput!]!
  }

  input CrmSortInput {
    property: String!
    dir: SortDir!
  }

  input CrmQueryInput {
    "Zero-based."
    page: Int!
    pageSize: Int!
    search: String
    groups: [CrmFilterGroupInput!]
    sorts: [CrmSortInput!]
  }

  type CrmView {
    id: ID!
    object: CrmObject!
    name: String!
    shared: Boolean!
    "Saved by the person asking, who may change or delete it."
    mine: Boolean!
    ownerName: String!
    search: String!
    groups: [CrmFilterGroup!]!
    sorts: [CrmSort!]!
    columns: [String!]!
  }

  input CrmViewInput {
    object: CrmObject!
    name: String!
    shared: Boolean!
    search: String!
    groups: [CrmFilterGroupInput!]!
    sorts: [CrmSortInput!]!
    columns: [String!]!
  }

  input CrmImportInput {
    object: CrmObject!
    mode: CrmImportMode!
    "Up to 500 rows, each an object of property key to cell text."
    rows: [JSON!]!
    "The file line of the first row, so issues name lines a person can find."
    firstRowNumber: Int!
  }

  type CrmImportIssue {
    row: Int!
    message: String!
    "Left alone on purpose (already exists, nothing to update) rather than invalid."
    skipped: Boolean!
  }

  type CrmImportResult {
    created: Int!
    updated: Int!
    skipped: Int!
    issues: [CrmImportIssue!]!
  }

  extend type Lead {
    "Values of the company's own properties, keyed by property key."
    custom: JSON!
  }

  extend type Company {
    custom: JSON!
  }

  extend type Contact {
    custom: JSON!
  }

  extend input LeadInput {
    custom: JSON
  }

  extend input CompanyInput {
    custom: JSON
  }

  extend input ContactInput {
    custom: JSON
  }

  extend type Query {
    crmObjectSchema(object: CrmObject!): CrmObjectSchema!
    crmProperties(object: CrmObject!): [CrmProperty!]!
    crmViews(object: CrmObject!): [CrmView!]!
    searchLeads(query: CrmQueryInput!): LeadPage!
    searchCompanies(query: CrmQueryInput!): CompanyPage!
    searchContacts(query: CrmQueryInput!): ContactPage!
  }

  extend type Mutation {
    createCrmProperty(input: CrmPropertyInput!): CrmProperty!
    "Creates the property on every chosen record type, or on none when any of them cannot take the key."
    createCrmProperties(input: CrmPropertiesInput!): [CrmProperty!]!
    updateCrmProperty(id: ID!, input: CrmPropertyUpdateInput!): CrmProperty!
    "Deletes the property and its values on every record."
    deleteCrmProperty(id: ID!): Boolean!
    createCrmView(input: CrmViewInput!): CrmView!
    updateCrmView(id: ID!, input: CrmViewInput!): CrmView!
    deleteCrmView(id: ID!): Boolean!
    importCrmRecords(input: CrmImportInput!): CrmImportResult!
  }
`;
