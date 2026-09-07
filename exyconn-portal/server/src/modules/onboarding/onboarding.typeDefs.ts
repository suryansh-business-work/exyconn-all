import gql from 'graphql-tag';

/**
 * Onboarding: the template HR keeps, and one checklist per joiner made from it.
 *
 * A template is edited freely; a checklist copies what it needs at the moment it is
 * started, so changing the template never rewrites what somebody was actually asked to do.
 */
export const onboardingTypeDefs = gql`
  "Who is expected to do an onboarding task — and, therefore, who may tick it off."
  enum OnboardingOwner {
    HR
    IT
    MANAGER
    EMPLOYEE
  }

  type OnboardingTask {
    key: String!
    label: String!
    owner: OnboardingOwner!
    "Days after the join date this task is due. 0 means the first day."
    dueDaysFromJoin: Int!
  }

  input OnboardingTaskInput {
    key: String!
    label: String!
    owner: OnboardingOwner!
    dueDaysFromJoin: Int!
  }

  type OnboardingTemplate {
    id: ID!
    name: String!
    active: Boolean!
    tasks: [OnboardingTask!]!
    "How many tasks the template holds — the column the HR grid sorts on."
    taskCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input OnboardingTemplateInput {
    name: String!
    active: Boolean!
    tasks: [OnboardingTaskInput!]!
  }

  type OnboardingTemplatePage {
    rows: [OnboardingTemplate!]!
    totalCount: Int!
  }

  type OnboardingItem {
    key: String!
    label: String!
    owner: OnboardingOwner!
    dueOn: DateTime!
    done: Boolean!
    doneAt: DateTime
    doneByName: String
    notes: String!
  }

  type OnboardingChecklist {
    id: ID!
    employeeId: String!
    employeeName: String!
    templateName: String!
    joinDate: DateTime!
    items: [OnboardingItem!]!
    "0-100, derived from the items so it can never disagree with them."
    progressPercent: Int!
    "True once every item is done."
    complete: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type OnboardingChecklistPage {
    rows: [OnboardingChecklist!]!
    totalCount: Int!
  }

  extend type Query {
    listOnboardingTemplates: [OnboardingTemplate!]!
    getOnboardingTemplate(id: ID!): OnboardingTemplate!
    listOnboardingTemplatesPaged(input: TableQueryInput!): OnboardingTemplatePage!
    listOnboardingTemplatesStats: TableStats!
    "HR: every joiner's checklist."
    listOnboardingChecklistsPaged(input: TableQueryInput!): OnboardingChecklistPage!
    listOnboardingChecklistsStats: TableStats!
    "Self-service: the signed-in employee's own checklist. Null when they have none."
    myOnboarding: OnboardingChecklist
  }

  extend type Mutation {
    createOnboardingTemplate(input: OnboardingTemplateInput!): OnboardingTemplate!
    updateOnboardingTemplate(id: ID!, input: OnboardingTemplateInput!): OnboardingTemplate!
    deleteOnboardingTemplate(id: ID!): Boolean!
    """
    Starts one joiner's onboarding from a template. HR only, and refused while the employee
    already has a checklist that is not finished — two open checklists is two answers to
    the same question.
    """
    startOnboarding(employeeId: ID!, templateId: ID!): OnboardingChecklist!
    """
    Ticks one item off (or back on) and records who did it.

    HR, IT and the employee's manager may act on any item. The employee may act only on the
    items their own onboarding asks THEM to do.
    """
    setOnboardingItem(
      checklistId: ID!
      key: String!
      done: Boolean!
      notes: String
    ): OnboardingChecklist!
    "HR: removes a checklist entirely — for one started against the wrong person."
    deleteOnboardingChecklist(id: ID!): Boolean!
  }
`;
