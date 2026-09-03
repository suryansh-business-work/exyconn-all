import { DateTimeResolver } from 'graphql-scalars';
import { baseTypeDefs } from './base.typeDefs';
import { authTypeDefs } from '../modules/auth/auth.typeDefs';
import { authResolvers } from '../modules/auth/auth.resolvers';
import { adminTypeDefs } from '../modules/admin/admin.typeDefs';
import { adminResolvers } from '../modules/admin/admin.resolvers';
import { financeTypeDefs, financeResolvers } from '../modules/finance';
import { bugsTypeDefs, bugsResolvers } from '../modules/bugs';
import { clientsTypeDefs, clientsResolvers } from '../modules/clients';
import { assetsTypeDefs, assetsResolvers } from '../modules/assets';
import { crmEntitiesTypeDefs, crmEntitiesResolvers } from '../modules/crm';
import { hrTypeDefs, hrResolvers } from '../modules/hr';
import { employeeTypeDefs, employeeResolvers } from '../modules/employee';
import { supportTypeDefs, supportResolvers } from '../modules/support';
import { marketingTypeDefs, marketingResolvers } from '../modules/marketing';
import { legalTypeDefs, legalResolvers } from '../modules/legal';
import { aiTypeDefs, aiResolvers } from '../modules/ai';
import { crmTypeDefs, crmResolvers } from '../modules/crm';
import { productsTypeDefs, productsResolvers } from '../modules/products';
import {
  projectsTypeDefs,
  projectsResolvers,
  boardTypeDefs,
  boardResolvers,
} from '../modules/projects';
import { techTypeDefs, techResolvers } from '../modules/tech';
import { statusTypeDefs, statusResolvers } from '../modules/status';
// The website module splits its SDL across one file per content entity, so it exports an array.
import { websiteTypeDefs, websiteResolvers } from '../modules/website';
import { trackerTypeDefs, trackerResolvers } from '../modules/tracker';
import { brandingTypeDefs, brandingResolvers } from '../modules/branding';
import { announcementsTypeDefs, announcementsResolvers } from '../modules/announcements';
import { notificationsTypeDefs, notificationsResolvers } from '../modules/notifications';
import { requestsTypeDefs, requestsResolvers } from '../modules/requests';
import { goalsTypeDefs, goalsResolvers } from '../modules/goals';
import { performanceTypeDefs, performanceResolvers } from '../modules/performance';
import { expensesTypeDefs, expensesResolvers } from '../modules/expenses';
import { benefitsTypeDefs, benefitsResolvers } from '../modules/benefits';
import { trainingTypeDefs, trainingResolvers } from '../modules/training';
import { documentsTypeDefs, documentsResolvers } from '../modules/documents';
import { hrMasterTypeDefs, hrMasterResolvers } from '../modules/hrmaster';
import { orgMasterTypeDefs, orgMasterResolvers } from '../modules/orgmaster';
import { exitTypeDefs, exitResolvers } from '../modules/exit';
import { payrollTypeDefs, payrollResolvers } from '../modules/payroll';
import { permissionsTypeDefs, permissionsResolvers } from '../modules/permissions';
import { JSONScalar } from './jsonScalar';

type ResolverGroup = Record<string, Record<string, unknown> | undefined>;

/**
 * Merges every module's resolver group. Query and Mutation are flattened
 * together; any other key is a type resolver map (computed fields), merged per
 * type so two modules can both contribute fields to the same type.
 */
function mergeResolvers(groups: ResolverGroup[]) {
  const Query: Record<string, unknown> = {};
  const Mutation: Record<string, unknown> = {};
  const types: Record<string, Record<string, unknown>> = {};
  for (const group of groups) {
    Object.assign(Query, group.Query ?? {});
    Object.assign(Mutation, group.Mutation ?? {});
    for (const [name, fields] of Object.entries(group)) {
      if (name === 'Query' || name === 'Mutation' || !fields) continue;
      types[name] = { ...types[name], ...fields };
    }
  }
  return { DateTime: DateTimeResolver, JSON: JSONScalar, Query, Mutation, ...types };
}

export const typeDefs = [
  baseTypeDefs,
  authTypeDefs,
  adminTypeDefs,
  financeTypeDefs,
  bugsTypeDefs,
  clientsTypeDefs,
  assetsTypeDefs,
  crmEntitiesTypeDefs,
  hrTypeDefs,
  employeeTypeDefs,
  supportTypeDefs,
  marketingTypeDefs,
  legalTypeDefs,
  aiTypeDefs,
  crmTypeDefs,
  productsTypeDefs,
  projectsTypeDefs,
  boardTypeDefs,
  techTypeDefs,
  ...websiteTypeDefs,
  trackerTypeDefs,
  brandingTypeDefs,
  announcementsTypeDefs,
  notificationsTypeDefs,
  requestsTypeDefs,
  goalsTypeDefs,
  performanceTypeDefs,
  expensesTypeDefs,
  benefitsTypeDefs,
  trainingTypeDefs,
  documentsTypeDefs,
  hrMasterTypeDefs,
  orgMasterTypeDefs,
  exitTypeDefs,
  payrollTypeDefs,
  permissionsTypeDefs,
  statusTypeDefs,
];

export const resolvers = mergeResolvers([
  authResolvers,
  adminResolvers,
  financeResolvers,
  bugsResolvers,
  clientsResolvers,
  assetsResolvers,
  crmEntitiesResolvers,
  hrResolvers,
  employeeResolvers,
  supportResolvers,
  marketingResolvers,
  legalResolvers,
  aiResolvers,
  productsResolvers,
  projectsResolvers,
  boardResolvers,
  crmResolvers,
  techResolvers,
  websiteResolvers,
  trackerResolvers,
  brandingResolvers,
  announcementsResolvers,
  notificationsResolvers,
  requestsResolvers,
  goalsResolvers,
  performanceResolvers,
  expensesResolvers,
  benefitsResolvers,
  trainingResolvers,
  documentsResolvers,
  hrMasterResolvers,
  orgMasterResolvers,
  exitResolvers,
  payrollResolvers,
  permissionsResolvers,
  statusResolvers,
]);
