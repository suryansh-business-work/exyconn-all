import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';
import { ItCloudResourceModel, ItNetworkItemModel, ItVulnerabilityModel } from './models';

const itOnly = [ROLES.IT];

/** Network register: every IT user reads and edits it; ADMIN passes every guard. */
const networkCrud = createCrudResolvers(
  createCrudService(ItNetworkItemModel as never, 'ItNetworkItem'),
  {
    name: 'ItNetworkItem',
    roles: itOnly,
    table: {
      searchFields: ['name', 'address', 'location', 'provider', 'notes'],
      filterFields: ['name', 'kind', 'status', 'location', 'provider'],
      sortFields: ['name', 'kind', 'status', 'location', 'createdAt'],
      defaultSort: { field: 'name', dir: 'ASC' },
    },
    stats: { countBy: ['kind', 'status'] },
  },
);

/** Cloud & infrastructure register, with cost summed for the IT spend view. */
const cloudCrud = createCrudResolvers(
  createCrudService(ItCloudResourceModel as never, 'ItCloudResource'),
  {
    name: 'ItCloudResource',
    roles: itOnly,
    table: {
      searchFields: ['name', 'provider', 'endpoint', 'region', 'ownerName', 'notes'],
      filterFields: ['name', 'kind', 'environment', 'status', 'provider'],
      sortFields: ['name', 'kind', 'environment', 'status', 'expiresAt', 'monthlyCost'],
      defaultSort: { field: 'name', dir: 'ASC' },
    },
    stats: { countBy: ['kind', 'environment', 'status'], sum: ['monthlyCost'] },
  },
);

/** Vulnerability register for the Security Center. */
const vulnerabilityCrud = createCrudResolvers(
  createCrudService(ItVulnerabilityModel as never, 'ItVulnerability'),
  {
    name: 'ItVulnerability',
    plural: 'ItVulnerabilities',
    roles: itOnly,
    table: {
      searchFields: ['title', 'cve', 'affectedSystem', 'ownerName', 'notes'],
      filterFields: ['title', 'cve', 'severity', 'source', 'status', 'affectedSystem'],
      sortFields: ['title', 'severity', 'status', 'discoveredAt', 'dueAt', 'createdAt'],
      defaultSort: { field: 'discoveredAt', dir: 'DESC' },
    },
    stats: { countBy: ['severity', 'status'] },
  },
);

export const itRegistersResolvers = {
  Query: { ...networkCrud.Query, ...cloudCrud.Query, ...vulnerabilityCrud.Query },
  Mutation: { ...networkCrud.Mutation, ...cloudCrud.Mutation, ...vulnerabilityCrud.Mutation },
};
