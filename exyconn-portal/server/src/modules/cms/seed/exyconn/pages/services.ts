import type { CmsSeedPage } from '../../types';
import { SERVICES_APPLICATION_MODERNIZATION_PAGE } from './services/application-modernization';
import { SERVICES_AUTOMATION_INTEGRATION_PAGE } from './services/automation-integration';
import { SERVICES_DATA_ANALYTICS_PAGE } from './services/data-analytics';
import { SERVICES_DIGITAL_CONSULTING_PAGE } from './services/digital-consulting';
import { SERVICES_ENTERPRISE_APPLICATION_PAGE } from './services/enterprise-application';
import { SERVICES_MAINTENANCE_PAGE } from './services/maintenance';
import { SERVICES_MOBILE_APPLICATION_DEVELOPMENT_PAGE } from './services/mobile-application-development';
import { SERVICES_SOFTWARE_AS_A_SERVICE_PAGE } from './services/software-as-a-service';
import { SERVICES_WHATSAPP_CHATBOT_PAGE } from './services/whatsapp-chatbot';
import { SERVICES_HUB_PAGE } from './services/hub';
import { SERVICES_DIGITAL_MARKETING_PAGE } from './services/digital-marketing';
import { SERVICES_SOFTWARE_DEVELOPMENT_OUTSOURCING_PAGE } from './services/software-development-outsourcing';

/** The services hub and every service page (/services, /services/*). */
export const SERVICE_PAGES: CmsSeedPage[] = [
  SERVICES_APPLICATION_MODERNIZATION_PAGE,
  SERVICES_AUTOMATION_INTEGRATION_PAGE,
  SERVICES_DATA_ANALYTICS_PAGE,
  SERVICES_DIGITAL_CONSULTING_PAGE,
  SERVICES_ENTERPRISE_APPLICATION_PAGE,
  SERVICES_MAINTENANCE_PAGE,
  SERVICES_MOBILE_APPLICATION_DEVELOPMENT_PAGE,
  SERVICES_SOFTWARE_AS_A_SERVICE_PAGE,
  SERVICES_WHATSAPP_CHATBOT_PAGE,
  SERVICES_HUB_PAGE,
  SERVICES_DIGITAL_MARKETING_PAGE,
  SERVICES_SOFTWARE_DEVELOPMENT_OUTSOURCING_PAGE,
];
