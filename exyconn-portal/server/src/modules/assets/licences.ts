import { LicenceModel } from './licence.model';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { badRequest } from '../../utils/errors';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

export interface LicenceInput {
  name: string;
  vendor: string;
  seatsTotal: number;
  assigneeIds?: string[];
  cost: number;
  billingCycle: string;
  renewalDate: Date;
  status: string;
  notes?: string;
}

export const licencesService = createCrudService<LicenceInput>(LicenceModel as never, 'Licence');

const crud = createCrudResolvers(licencesService, {
  name: 'Licence',
  roles: [ROLES.IT],
  table: {
    searchFields: ['name', 'vendor', 'notes'],
    filterFields: ['name', 'vendor', 'billingCycle', 'status'],
    sortFields: ['name', 'vendor', 'seatsTotal', 'cost', 'renewalDate', 'status', 'createdAt'],
    defaultSort: { field: 'renewalDate', dir: 'ASC' },
  },
  stats: { countBy: ['status', 'billingCycle'], sum: ['cost', 'seatsTotal'] },
});

/**
 * Seats are the whole reason this register exists, so handing out more of them than were
 * bought is refused rather than recorded. The check sits here because the shared CRUD
 * service updates through `findByIdAndUpdate`, which skips schema validators.
 */
function assertSeatsFit(input: LicenceInput): void {
  const used = input.assigneeIds?.length ?? 0;
  if (used > input.seatsTotal) {
    badRequest(`This licence has ${input.seatsTotal} seat(s) — ${used} people are assigned.`);
  }
}

type LicenceArgs = { input: LicenceInput };

/** Licence CRUD, with the seat count enforced on the way in. */
export const licencesResolvers = {
  Query: crud.Query,
  Mutation: {
    ...crud.Mutation,
    createLicence: async (p: unknown, args: LicenceArgs, ctx: GraphQLContext) => {
      assertSeatsFit(args.input);
      return crud.Mutation.createLicence(p, args as never, ctx);
    },
    updateLicence: async (p: unknown, args: LicenceArgs & { id: string }, ctx: GraphQLContext) => {
      assertSeatsFit(args.input);
      return crud.Mutation.updateLicence(p, args as never, ctx);
    },
  },
};
