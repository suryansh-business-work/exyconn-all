import type { CmsSeedPage } from '../../types';
import { seedPage } from '../page-doc';
import cookies from './cookies.json';

/**
 * exyconn.com/cookies (formerly src/pages/[market]/cookies.astro): the legal document.
 */
export const COOKIES_PAGE: CmsSeedPage = seedPage(cookies);
