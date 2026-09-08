import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { withId } from '../../utils/serialize';
import { ApplicantModel } from './applicant.model';
import { setApplicantStage } from './recruiting.service';
import type { ApplicantStage } from './recruiting.constants';
import type { GraphQLContext } from '../../middleware/auth';

interface ApplicantInput {
  jobCode: string;
  jobTitle: string;
  companySlug?: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter: string;
  source: string;
  rating: number;
}

/** The module name every guard and the admin permission matrix use. */
const MODULE = 'Applicant';
const hrOnly = [ROLES.HR];

export const applicantsService = createCrudService<ApplicantInput>(
  ApplicantModel as never,
  'Applicant',
);

const applicantCrud = createCrudResolvers(applicantsService, {
  name: MODULE,
  roles: hrOnly,
  table: {
    searchFields: ['name', 'email', 'jobTitle'],
    filterFields: ['stage', 'jobCode', 'source'],
    sortFields: ['name', 'email', 'jobTitle', 'jobCode', 'stage', 'rating', 'source', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['stage', 'jobCode'] },
});

export const recruitingResolvers = {
  Query: { ...applicantCrud.Query },
  Mutation: {
    ...applicantCrud.Mutation,
    setApplicantStage: async (
      _p: unknown,
      { id, stage, note }: { id: string; stage: ApplicantStage; note?: string | null },
      ctx: GraphQLContext,
    ) => {
      const user = await assertPermission(ctx, MODULE, hrOnly, 'EDIT');
      return withId(await setApplicantStage(id, stage, note ?? '', user.email));
    },
  },
};
