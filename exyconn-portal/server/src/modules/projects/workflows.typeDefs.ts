import gql from 'graphql-tag';

export const workflowsTypeDefs = gql`
  "The kinds of box a workflow is drawn from."
  enum WorkflowNodeKind {
    START
    STEP
    DECISION
    END
  }

  "One box on a workflow canvas. The key is the editor's own id for it."
  type WorkflowNode {
    key: String!
    kind: WorkflowNodeKind!
    label: String!
    x: Float!
    y: Float!
  }

  "One arrow between two boxes, by their keys."
  type WorkflowEdge {
    key: String!
    source: String!
    target: String!
    label: String!
  }

  "A custom workflow drawn in Tools > Workflows."
  type ProjectWorkflow {
    id: ID!
    name: String!
    description: String!
    nodes: [WorkflowNode!]!
    edges: [WorkflowEdge!]!
    createdByName: String!
    updatedByName: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ProjectWorkflowInput {
    name: String!
    description: String
  }

  input WorkflowNodeInput {
    key: String!
    kind: WorkflowNodeKind!
    label: String!
    x: Float!
    y: Float!
  }

  input WorkflowEdgeInput {
    key: String!
    source: String!
    target: String!
    label: String!
  }

  "The whole drawing. Saved as one, and refused whole when it breaks a rule."
  input WorkflowGraphInput {
    nodes: [WorkflowNodeInput!]!
    edges: [WorkflowEdgeInput!]!
  }

  extend type Query {
    "Every workflow, most recently changed first. Nodes and edges are empty in this list."
    projectWorkflows: [ProjectWorkflow!]!
    projectWorkflow(id: ID!): ProjectWorkflow!
  }

  extend type Mutation {
    "A new workflow opens with a Start joined to an End."
    createProjectWorkflow(input: ProjectWorkflowInput!): ProjectWorkflow!
    updateProjectWorkflow(id: ID!, input: ProjectWorkflowInput!): ProjectWorkflow!
    saveProjectWorkflowGraph(id: ID!, graph: WorkflowGraphInput!): ProjectWorkflow!
    deleteProjectWorkflow(id: ID!): Boolean!
  }
`;
