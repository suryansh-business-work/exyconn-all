import { ObjectiveModel } from './objective.model';
import { objectiveAchievement } from './compliance.constants';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

export interface ObjectiveInput {
  title: string;
  description: string;
  standards: string[];
  category: string;
  scope: string;
  area: string;
  ownerId: string;
  ownerName: string;
  measure: string;
  unit: string;
  baseline: number;
  target: number;
  actual: number;
  frequency: string;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  plan: string;
}

export const objectivesService = createCrudService<ObjectiveInput>(
  ObjectiveModel as never,
  'Objective',
);

const crud = createCrudResolvers(objectivesService, {
  name: 'Objective',
  roles: [ROLES.COMPLIANCE],
  table: {
    searchFields: ['title', 'description', 'measure', 'area', 'ownerName'],
    filterFields: ['category', 'status', 'scope', 'ownerId'],
    sortFields: ['title', 'category', 'status', 'periodEnd', 'createdAt'],
    defaultSort: { field: 'periodEnd', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'category'] },
});

export const objectiveResolvers = {
  Query: crud.Query,
  Mutation: crud.Mutation,
  Objective: {
    achievementPercent: (o: { baseline: number; target: number; actual: number }) =>
      objectiveAchievement(o.baseline, o.target, o.actual),
  },
};
