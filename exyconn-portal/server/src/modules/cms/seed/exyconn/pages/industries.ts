import type { CmsSeedPage } from '../../types';
import { seedPage } from '../page-doc';
import hub from './industries/hub.json';
import hospitality from './industries/hospitality.json';
import cafesCoffeeShops from './industries/cafes-coffee-shops.json';
import restaurants from './industries/restaurants.json';
import travelTourism from './industries/travel-tourism.json';
import healthcare from './industries/healthcare.json';
import beautyWellness from './industries/beauty-wellness.json';
import fitnessSports from './industries/fitness-sports.json';
import eventsEntertainment from './industries/events-entertainment.json';
import realEstate from './industries/real-estate.json';
import construction from './industries/construction.json';
import manufacturing from './industries/manufacturing.json';
import automotive from './industries/automotive.json';
import retailEcommerce from './industries/retail-ecommerce.json';
import logistics from './industries/logistics.json';
import education from './industries/education.json';
import startupsSaas from './industries/startups-saas.json';
import bfsi from './industries/bfsi.json';
import legal from './industries/legal.json';
import professionalServices from './industries/professional-services.json';
import hrRecruitment from './industries/hr-recruitment.json';

/**
 * The industries hub and one page per industry (/industries, /industries/*). Each industry
 * page's six use cases are in the order its 3D scene numbers them (the website's
 * src/scripts/stage3d/shapes/industries): card `n` and story moments with `useCase: n` light
 * marker `n`.
 */
export const INDUSTRY_PAGES: CmsSeedPage[] = [
  hub,
  hospitality,
  cafesCoffeeShops,
  restaurants,
  travelTourism,
  healthcare,
  beautyWellness,
  fitnessSports,
  eventsEntertainment,
  realEstate,
  construction,
  manufacturing,
  automotive,
  retailEcommerce,
  logistics,
  education,
  startupsSaas,
  bfsi,
  legal,
  professionalServices,
  hrRecruitment,
].map(seedPage);
