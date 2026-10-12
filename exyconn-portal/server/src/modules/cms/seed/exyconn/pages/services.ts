import type { CmsSeedPage } from '../../types';
import { seedPage } from '../page-doc';
import applicationModernization from './services/application-modernization.json';
import automationIntegration from './services/automation-integration.json';
import dataAnalytics from './services/data-analytics.json';
import digitalConsulting from './services/digital-consulting.json';
import enterpriseApplication from './services/enterprise-application.json';
import maintenance from './services/maintenance.json';
import mobileApplicationDevelopment from './services/mobile-application-development.json';
import softwareAsAService from './services/software-as-a-service.json';
import whatsappChatbot from './services/whatsapp-chatbot.json';
import hub from './services/hub.json';
import digitalMarketing from './services/digital-marketing.json';
import softwareDevelopmentOutsourcing from './services/software-development-outsourcing.json';

/** The services hub and every service page (/services, /services/*). */
export const SERVICE_PAGES: CmsSeedPage[] = [
  applicationModernization,
  automationIntegration,
  dataAnalytics,
  digitalConsulting,
  enterpriseApplication,
  maintenance,
  mobileApplicationDevelopment,
  softwareAsAService,
  whatsappChatbot,
  hub,
  digitalMarketing,
  softwareDevelopmentOutsourcing,
].map(seedPage);
