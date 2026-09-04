import gql from 'graphql-tag';

export const boardTypeDefs = gql`
  enum TaskType {
    TASK
    STORY
    BUG
    EPIC
  }

  enum TaskPriority {
    HIGHEST
    HIGH
    MEDIUM
    LOW
    LOWEST
  }

  type BoardColumn {
    id: ID!
    name: String!
    order: Int!
  }

  "One ticket on a project board."
  type Task {
    id: ID!
    columnId: ID!
    "The ticket's human handle, e.g. EXY-14. Fixed for the life of the ticket."
    key: String!
    title: String!
    "Rich text (HTML) written in the ticket editor."
    description: String
    type: TaskType!
    priority: TaskPriority!
    assigneeId: String!
    assigneeName: String!
    reporterName: String!
    labels: [String!]!
    "Estimate in points. Null means nobody has sized it, which is not the same as zero."
    storyPoints: Int
    dueDate: DateTime
    order: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "Everything a ticket carries that a person can edit. Only the title is required."
  input TaskInput {
    title: String!
    description: String
    type: TaskType
    priority: TaskPriority
    assigneeId: String
    labels: [String!]
    storyPoints: Int
    dueDate: DateTime
  }

  type TaskComment {
    id: ID!
    taskId: ID!
    authorId: String!
    authorName: String!
    body: String!
    createdAt: DateTime!
  }

  "One recorded change to a ticket: who changed what, from what, to what."
  type TaskActivity {
    id: ID!
    taskId: ID!
    actorName: String!
    "The field that changed: a ticket field name, or column, or created."
    field: String!
    fromValue: String!
    toValue: String!
    createdAt: DateTime!
  }

  "Somebody a ticket can be assigned to."
  type ProjectMember {
    id: ID!
    name: String!
    email: String!
  }

  type ProjectBoard {
    columns: [BoardColumn!]!
    tasks: [Task!]!
  }

  extend type Query {
    projectBoard(projectId: ID!): ProjectBoard!
    "Every ticket in a project, newest first — the list view behind the board."
    projectTasks(projectId: ID!): [Task!]!
    taskComments(taskId: ID!): [TaskComment!]!
    "The ticket's history, newest first."
    taskActivity(taskId: ID!): [TaskActivity!]!
    "Who tickets can be assigned to: everyone who can open this module."
    listProjectMembers: [ProjectMember!]!
  }

  extend type Mutation {
    createColumn(projectId: ID!, name: String!): BoardColumn!
    renameColumn(id: ID!, name: String!): BoardColumn!
    deleteColumn(id: ID!): Boolean!
    reorderColumns(projectId: ID!, columnIds: [ID!]!): Boolean!

    createTask(projectId: ID!, columnId: ID!, input: TaskInput!): Task!
    updateTask(id: ID!, input: TaskInput!): Task!
    deleteTask(id: ID!): Boolean!
    moveTask(id: ID!, toColumnId: ID!, toIndex: Int!): Boolean!

    addTaskComment(taskId: ID!, body: String!): TaskComment!
    deleteTaskComment(id: ID!): Boolean!
  }
`;
