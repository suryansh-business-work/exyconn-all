import type { CmsSeedPage } from '../../types';
import { AI_SERVICE_DETAIL_PAGES } from './ai-services/detail';
import { AI_SERVICES_HUB_PAGE } from './ai-services/hub';

/** The AI service catalogue (/ai-services) and one page per AI service (/ai-services/<slug>). */
export const AI_SERVICE_PAGES: CmsSeedPage[] = [AI_SERVICES_HUB_PAGE, ...AI_SERVICE_DETAIL_PAGES];
