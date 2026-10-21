import { ContractModel } from './legal.model';
import { LegalDocumentModel } from './document.model';
import { legalCustomResolvers } from './legal.resolvers';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';
import { withGroupCheck } from './legal-group.service';
import { legalGroupResolvers } from './legal-group.resolvers';
// Imported for its side effect: the module registers what it wants chased.
import './legal.reminders';

interface ContractInput {
  title: string;
  party: string;
  type: string;
  effectiveDate: Date;
  expiryDate: Date;
  status: string;
  /** The document a counterparty is asked to sign. Empty until one is attached. */
  documentUrl?: string;
  /** The contract's text as rich-text HTML. */
  content?: string;
  groupId?: string | null;
}

interface LegalDocumentInput {
  title: string;
  category: string;
  owner?: string;
  fileUrl?: string;
  /** The document's text as rich-text HTML. */
  content?: string;
  status: string;
  groupId?: string | null;
}

export const legalService = withGroupCheck(
  createCrudService<ContractInput>(ContractModel as never, 'Contract'),
  'CONTRACT',
);
const contractResolvers = createCrudResolvers(legalService, {
  name: 'Contract',
  roles: [ROLES.LEGAL],
  table: {
    searchFields: ['title', 'party'],
    filterFields: ['title', 'party', 'type', 'status'],
    sortFields: ['title', 'party', 'type', 'effectiveDate', 'expiryDate', 'status', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'signedBy'] },
});

export const documentService = withGroupCheck(
  createCrudService<LegalDocumentInput>(LegalDocumentModel as never, 'LegalDocument'),
  'DOCUMENT',
);
const documentResolvers = createCrudResolvers(documentService, {
  name: 'LegalDocument',
  roles: [ROLES.LEGAL],
  table: {
    searchFields: ['title', 'owner', 'fileUrl'],
    filterFields: ['title', 'owner', 'fileUrl', 'category', 'status'],
    sortFields: ['title', 'category', 'owner', 'fileUrl', 'status', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status'] },
});

/** Merges contract CRUD, document CRUD, and the custom send/sign mutations. */
export const legalResolvers = {
  /** Written before a document could be attached, a `.lean()` row comes back without it. */
  Contract: {
    documentUrl: (contract: { documentUrl?: string | null }) => contract.documentUrl ?? '',
  },
  Query: {
    ...contractResolvers.Query,
    ...documentResolvers.Query,
    ...legalCustomResolvers.Query,
    ...legalGroupResolvers.Query,
  },
  Mutation: {
    ...contractResolvers.Mutation,
    ...documentResolvers.Mutation,
    ...legalCustomResolvers.Mutation,
    ...legalGroupResolvers.Mutation,
  },
};

export { legalTypeDefs } from './legal.typeDefs';
export { legalGroupTypeDefs } from './legal-group.typeDefs';
export { policyTypeDefs } from './policy.typeDefs';
export { policyResolvers, policiesService } from './policy.resolvers';
