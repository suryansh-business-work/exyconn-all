import type { DetailPage } from "./schema";
import agentic from "./ai/agentic";
import botCreation from "./ai/bot-creation";
import customModelTraining from "./ai/custom-model-training";
import llms from "./ai/llms";
import mcpServer from "./ai/mcp-server";
import models from "./ai/models";
import workflows from "./ai/workflows";
import applicationModernization from "./services/application-modernization";
import automationIntegration from "./services/automation-integration";
import dataAnalytics from "./services/data-analytics";
import digitalConsulting from "./services/digital-consulting";
import enterpriseApplication from "./services/enterprise-application";
import maintenance from "./services/maintenance";
import mobileApplicationDevelopment from "./services/mobile-application-development";
import softwareAsAService from "./services/software-as-a-service";
import whatsappChatbot from "./services/whatsapp-chatbot";

/**
 * Every capability and service detail page, in the order the related cards walk them. Page
 * files import their own module; the template reads this list for the related cards.
 */
export const DETAIL_PAGES: readonly DetailPage[] = [
  agentic,
  llms,
  models,
  customModelTraining,
  mcpServer,
  workflows,
  botCreation,
  applicationModernization,
  automationIntegration,
  dataAnalytics,
  digitalConsulting,
  enterpriseApplication,
  maintenance,
  mobileApplicationDevelopment,
  softwareAsAService,
  whatsappChatbot,
];
