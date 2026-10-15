import gql from 'graphql-tag';

/**
 * The ticket as a page of its own: found by its key, made public or private, and shared.
 * `publicTask` is deliberately unauthenticated — it is what a public link opens — and
 * answers with a narrow, read-only projection, or null.
 */
export const ticketTypeDefs = gql`
  "Who may read a ticket: people signed in to Projects, or anyone holding its public link."
  enum TaskVisibility {
    PRIVATE
    PUBLIC
  }

  extend type Task {
    projectId: ID!
    visibility: TaskVisibility!
    "The read-only link anyone can open. Null while the ticket is private."
    publicUrl: String
  }

  "What a public ticket link shows. No comments, history, attachments or ids."
  type PublicTaskView {
    key: String!
    title: String!
    "Rich text (HTML)."
    description: String!
    type: TaskType!
    priority: TaskPriority!
    "The name of the board column the ticket sits in."
    status: String!
    isDone: Boolean!
    assigneeName: String!
    labels: [String!]!
    dueDate: DateTime
    projectName: String!
    updatedAt: DateTime!
  }

  extend type Query {
    "One ticket by its key, e.g. EXY-14. Null when no ticket has that key."
    taskByKey(key: String!): Task
    "A project's board columns, without its tickets."
    projectColumns(projectId: ID!): [BoardColumn!]!
    "Public. Null when the token is unknown or the ticket is private again."
    publicTask(token: String!): PublicTaskView
  }

  extend type Mutation {
    "Making a ticket public issues a new link; making it private kills the old one."
    setTaskVisibility(id: ID!, visibility: TaskVisibility!): Task!
    "Notifies the people chosen. Returns how many were told."
    shareTask(id: ID!, recipientIds: [ID!]!, note: String): Int!
  }
`;
