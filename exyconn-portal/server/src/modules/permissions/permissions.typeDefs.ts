import gql from 'graphql-tag';

export const permissionsTypeDefs = gql`
  enum PermissionAction {
    VIEW
    CREATE
    EDIT
    DELETE
    APPROVE
    EXPORT
  }

  type RolePermission {
    id: ID!
    role: Role!
    module: String!
    actions: [PermissionAction!]!
    updatedAt: DateTime!
  }

  extend type Query {
    "Every module that can be restricted, as registered by the server."
    listPermissionModules: [String!]!
    "Only restrictions that exist; a missing (role, module) pair means everything is allowed."
    listRolePermissions: [RolePermission!]!
  }

  extend type Mutation {
    """
    Sets exactly what a role may do in a module. An empty list blocks the role
    from the module entirely; deleting the row (clearRolePermission) restores
    the default of everything the role's module access allows.
    """
    setRolePermission(role: Role!, module: String!, actions: [PermissionAction!]!): RolePermission!
    clearRolePermission(role: Role!, module: String!): Boolean!
  }
`;
