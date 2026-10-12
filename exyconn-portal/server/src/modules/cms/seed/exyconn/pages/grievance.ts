import type { CmsSeedPage } from '../../types';
import { seedPage } from '../page-doc';
import grievance from './grievance.json';

/**
 * exyconn.com/grievance (formerly src/pages/[market]/grievance.astro): the legal document,
 * with the sections it renders itself (questions, a form).
 */
export const GRIEVANCE_PAGE: CmsSeedPage = seedPage(grievance);
