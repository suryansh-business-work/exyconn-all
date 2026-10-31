import { currentOrganizationId } from '../../../lib/tenant';
import { logger } from '../../../utils/logger';
import { OpenAiConfigModel } from '../../tech/openai-config.model';
import { knowledgeFor } from '../../website-chat/chat.retrieve';
import { readChatSettings } from '../../website-chat/chat.settings';

/** How much of our own website the model reads about what we offer. */
export const MAX_OFFERING_CHARS = 4000;
/** How much of the prospect the search for matching services is about. */
const MAX_QUERY_CHARS = 2000;

/**
 * What we sell that fits this prospect: the passages of our own website (Agents > Website chat's
 * knowledge, synced from it) most about their business, found the way the website bot finds
 * answers. Empty when there is no knowledge or no OpenAI key. A failed lookup is logged and
 * leaves the email to the person's own offer: it never stops the draft being written.
 */
export async function ourOffering(aboutThem: string): Promise<string> {
  const query = aboutThem.trim().slice(0, MAX_QUERY_CHARS);
  const config = await OpenAiConfigModel.findOne({ isActive: true }).select('apiKey').lean();
  if (!config || query === '') {
    return '';
  }
  try {
    const settings = await readChatSettings();
    const knowledge = await knowledgeFor(query, MAX_OFFERING_CHARS, currentOrganizationId() ?? '', {
      apiKey: config.apiKey,
      model: settings.embeddingModel,
    });
    return knowledge.text;
  } catch (error) {
    logger.warn({ err: error }, 'Cold email: reading what we offer failed');
    return '';
  }
}
