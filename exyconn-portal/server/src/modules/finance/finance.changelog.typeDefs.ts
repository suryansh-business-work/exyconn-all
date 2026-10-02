import gql from 'graphql-tag';

export const financeChangeLogTypeDefs = gql`
  extend type Query {
    "The audit log narrowed to finance records: invoices, schedules, payments, spend, claims and budgets."
    listFinanceChangeLogPaged(input: TableQueryInput!): AuditLogPage!
    "Per-action and per-module counts over the same finance records."
    listFinanceChangeLogStats: TableStats!
  }
`;
