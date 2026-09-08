import gql from 'graphql-tag';

export const sprintsTypeDefs = gql`
  enum SprintState {
    PLANNED
    ACTIVE
    COMPLETED
  }

  enum MilestoneState {
    PLANNED
    IN_PROGRESS
    HIT
    MISSED
  }

  "A time-boxed run of work on one project. Only one sprint per project may be ACTIVE."
  type Sprint {
    id: ID!
    projectId: ID!
    name: String!
    goal: String!
    startsOn: DateTime
    endsOn: DateTime
    state: SprintState!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input SprintInput {
    name: String!
    goal: String
    startsOn: DateTime
    endsOn: DateTime
  }

  "A dated commitment on a project — a launch, a review, a hand-over."
  type Milestone {
    id: ID!
    projectId: ID!
    name: String!
    description: String!
    dueOn: DateTime
    state: MilestoneState!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input MilestoneInput {
    name: String!
    description: String
    dueOn: DateTime
    state: MilestoneState
  }

  "Where the tickets left over at the end of a sprint would land, asked before completing."
  type SprintCompletionPlan {
    unfinishedCount: Int!
    "The next planned sprint they move to, or null when they go back to the backlog."
    targetSprintId: ID
    "What to call that destination in the confirmation — a sprint name, or the backlog."
    targetSprintName: String!
  }

  extend type Query {
    projectSprints(projectId: ID!): [Sprint!]!
    projectMilestones(projectId: ID!): [Milestone!]!
    "What completing this sprint would do to its unfinished tickets."
    sprintCompletionPlan(id: ID!): SprintCompletionPlan!
  }

  extend type Mutation {
    createSprint(projectId: ID!, input: SprintInput!): Sprint!
    updateSprint(id: ID!, input: SprintInput!): Sprint!
    "Deletes the sprint and returns its tickets to the backlog."
    deleteSprint(id: ID!): Boolean!
    startSprint(id: ID!): Sprint!
    "Completes the sprint, moving unfinished tickets on per sprintCompletionPlan."
    completeSprint(id: ID!): Sprint!

    createMilestone(projectId: ID!, input: MilestoneInput!): Milestone!
    updateMilestone(id: ID!, input: MilestoneInput!): Milestone!
    deleteMilestone(id: ID!): Boolean!

    "Puts a ticket in a sprint, or back in the backlog with a null sprint."
    setTaskSprint(taskId: ID!, sprintId: ID): Task!
    "Files a ticket under an epic, or takes it out of one with a null parent."
    setTaskParent(taskId: ID!, parentTaskId: ID): Task!
  }
`;
