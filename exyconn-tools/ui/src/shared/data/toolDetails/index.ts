import type { ToolDetailContent, ToolDetailsMap } from './types';
import { businessUtilityToolDetails } from './business-utility';
import { sitemapToolDetails } from './sitemap';
import { websiteUrlToolDetails } from './website-url';
import { aiChatToolDetails } from './ai-chat';
import { aiWritingToolDetails } from './ai-writing';
import { aiGeneratorToolDetails } from './ai-generator';
import { faqSupportToolDetails } from './faq-support';
import { converterToolDetails } from './converter';
import { domainNetworkToolDetails } from './domain-network';
import { pdfToolDetails } from './pdf';
import { imageToolDetails } from './image';
import { seoToolDetails } from './seo';

export type { ToolDetailContent, ToolDetailsMap, ToolFaq } from './types';

/** All tool detail content, keyed by tool id (matches ToolItem.id in toolsData). */
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

export const getToolDetails = (toolId: string): ToolDetailContent | undefined =>
  toolDetails[toolId];
