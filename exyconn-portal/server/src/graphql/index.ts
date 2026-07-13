import { DateTimeResolver } from 'graphql-scalars';
import { baseTypeDefs } from './base.typeDefs';
import { authTypeDefs } from '../modules/auth/auth.typeDefs';
import { authResolvers } from '../modules/auth/auth.resolvers';
import { adminTypeDefs } from '../modules/admin/admin.typeDefs';
import { adminResolvers } from '../modules/admin/admin.resolvers';
import { financeTypeDefs, financeResolvers } from '../modules/finance';
import { bugsTypeDefs, bugsResolvers } from '../modules/bugs';
import { clientsTypeDefs, clientsResolvers } from '../modules/clients';
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
// The website module splits its SDL across one file per content entity, so it exports an array.
import { websiteTypeDefs, websiteResolvers } from '../modules/website';
import { trackerTypeDefs, trackerResolvers } from '../modules/tracker';
import { JSONScalar } from './jsonScalar';

type ResolverGroup = {
  Query?: Record<string, unknown>;
  Mutation?: Record<string, unknown>;
};

/** Deep-merges the Query/Mutation maps from every module resolver group. */
function mergeResolvers(groups: ResolverGroup[]) {
  const Query: Record<string, unknown> = {};
  const Mutation: Record<string, unknown> = {};
  for (const group of groups) {
    Object.assign(Query, group.Query ?? {});
    Object.assign(Mutation, group.Mutation ?? {});
  }
  return { DateTime: DateTimeResolver, JSON: JSONScalar, Query, Mutation };
}

export const typeDefs = [
  baseTypeDefs,
  authTypeDefs,
  adminTypeDefs,
  financeTypeDefs,
  bugsTypeDefs,
  clientsTypeDefs,
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
];

export const resolvers = mergeResolvers([
  authResolvers,
  adminResolvers,
  financeResolvers,
  bugsResolvers,
  clientsResolvers,
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
]);
