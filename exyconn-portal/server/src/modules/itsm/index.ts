import { itRegistersTypeDefs } from './registers.typeDefs';
import { itWorkflowTypeDefs } from './workflow.typeDefs';
import { itInsightsTypeDefs } from './insights.typeDefs';
import { itRegistersResolvers } from './registers';
import { itAccessResolvers } from './access';
import { itChangeResolvers } from './changes';
import { itIncidentResolvers } from './incidents';
import { itPurchaseResolvers } from './purchases';
import { itSettingsResolvers } from './settings';
import { itDashboard } from './dashboard';
import { itEmployeeProfile } from './profile';
import { itCostSummaryResolver } from './cost';
import { itReport } from './reports';
import { itOffboarding, itOnboarding, itProvisionOnboarding, itRevokeAllAccess } from './lifecycle';
import { itScopedListResolvers } from './scoped-lists';
import { itDisableLeaverAccount } from './offboarding-account';

/**
 * IT service management: the registers IT keeps (network, cloud, vulnerabilities), its
 * workflows (access, changes, incidents, purchases), its settings, and the read models the IT
 * portal is built on. Tickets, the knowledge base, assets, licences, onboarding, exits,
 * announcements and policies stay in the modules that own them — IT reads its slice of each.
 */
export const itsmTypeDefs = [itRegistersTypeDefs, itWorkflowTypeDefs, itInsightsTypeDefs];

export const itsmResolvers = {
  Query: {
    ...itRegistersResolvers.Query,
    ...itAccessResolvers.Query,
    ...itChangeResolvers.Query,
    ...itIncidentResolvers.Query,
    ...itPurchaseResolvers.Query,
    ...itSettingsResolvers.Query,
    ...itScopedListResolvers,
    itDashboard,
    itEmployeeProfile,
    itCostSummary: itCostSummaryResolver,
    itReport,
    itOnboarding,
    itOffboarding,
  },
  Mutation: {
    ...itRegistersResolvers.Mutation,
    ...itAccessResolvers.Mutation,
    ...itChangeResolvers.Mutation,
    ...itIncidentResolvers.Mutation,
    ...itPurchaseResolvers.Mutation,
    ...itSettingsResolvers.Mutation,
    itProvisionOnboarding,
    itRevokeAllAccess,
    itDisableLeaverAccount,
  },
};
