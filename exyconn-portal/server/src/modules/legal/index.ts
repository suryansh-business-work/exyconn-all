import { ContractModel } from './legal.model';
import { LegalDocumentModel } from './document.model';
import { legalTypeDefs } from './legal.typeDefs';
import { legalCustomResolvers } from './legal.resolvers';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

interface ContractInput {
  title: string;
  party: string;
  type: string;
  effectiveDate: Date;
  expiryDate: Date;
  status: string;
}

interface LegalDocumentInput {
  title: string;
  category: string;
  owner?: string;
  fileUrl?: string;
  status: string;
}

export const legalService = createCrudService<ContractInput>(ContractModel as never, 'Contract');
const contractResolvers = createCrudResolvers(legalService, {
  name: 'Contract',
  roles: [ROLES.LEGAL],
});

export const documentService = createCrudService<LegalDocumentInput>(
  LegalDocumentModel as never,
  'LegalDocument',
);
const documentResolvers = createCrudResolvers(documentService, {
  name: 'LegalDocument',
  roles: [ROLES.LEGAL],
});

/** Merges contract CRUD, document CRUD, and the custom send/sign mutations. */
export const legalResolvers = {
  Query: { ...contractResolvers.Query, ...documentResolvers.Query },
  Mutation: {
    ...contractResolvers.Mutation,
    ...documentResolvers.Mutation,
    ...legalCustomResolvers.Mutation,
  },
};

export { legalTypeDefs };
