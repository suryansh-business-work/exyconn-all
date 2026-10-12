import type { ToolDetailContent, ToolDetailsMap } from './types';
import businessUtilityToolDetails from './business-utility.json';
import sitemapToolDetails from './sitemap.json';
import websiteUrlToolDetails from './website-url.json';
import aiChatToolDetails from './ai-chat.json';
import aiWritingToolDetails from './ai-writing.json';
import aiGeneratorToolDetails from './ai-generator.json';
import faqSupportToolDetails from './faq-support.json';
import converterToolDetails from './converter.json';
import domainNetworkToolDetails from './domain-network.json';
import pdfToolDetails from './pdf.json';
import imageToolDetails from './image.json';
import seoToolDetails from './seo.json';

export type { ToolDetailContent, ToolDetailsMap, ToolFaq } from './types';

/**
 * All tool detail content, keyed by tool id (matches ToolItem.id in toolsData). The words live in
 * one JSON file per tool category beside this module.
 */
export const toolDetails: ToolDetailsMap = {
  ...businessUtilityToolDetails,
  ...sitemapToolDetails,
  ...websiteUrlToolDetails,
  ...aiChatToolDetails,
  ...aiWritingToolDetails,
  ...aiGeneratorToolDetails,
  ...faqSupportToolDetails,
  ...converterToolDetails,
  ...domainNetworkToolDetails,
  ...pdfToolDetails,
  ...imageToolDetails,
  ...seoToolDetails,
};

export const getToolDetails = (toolId: string): ToolDetailContent | undefined => toolDetails[toolId];
