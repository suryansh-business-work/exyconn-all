import type { CmsSeedPage } from '../types';
import { HOME_PAGE } from './pages/home';
import { ABOUT_US_PAGE } from './pages/about-us';
import { CONTACT_PAGE } from './pages/contact';
import { COOKIES_PAGE } from './pages/cookies';
import { EXYCONN_SERVICES_PAGE } from './pages/exyconn-services';
import { GET_A_QUOTE_PAGE } from './pages/get-a-quote';
import { GRIEVANCE_PAGE } from './pages/grievance';
import { INDIA_OFFER_PAGE } from './pages/india-offer';
import { LEGAL_PAGE } from './pages/legal';
import { ORDER_AGENTS_PAGE } from './pages/order-agents';
import { OUR_SERVICES_PAGE } from './pages/our-services';
import { OUR_VISION_PAGE } from './pages/our-vision';
import { PRIVACY_POLICY_PAGE } from './pages/privacy-policy';
import { SITEMAP_PAGE } from './pages/sitemap';

/** Every migrated page of exyconn.com, one file per page or area under pages/. */
export const EXYCONN_PAGES: CmsSeedPage[] = [
  HOME_PAGE,
  // Company, legal, forms and offer pages.
  ABOUT_US_PAGE,
  OUR_VISION_PAGE,
  CONTACT_PAGE,
  EXYCONN_SERVICES_PAGE,
  OUR_SERVICES_PAGE,
  GET_A_QUOTE_PAGE,
  ORDER_AGENTS_PAGE,
  SITEMAP_PAGE,
  INDIA_OFFER_PAGE,
  PRIVACY_POLICY_PAGE,
  COOKIES_PAGE,
  LEGAL_PAGE,
  GRIEVANCE_PAGE,
];
