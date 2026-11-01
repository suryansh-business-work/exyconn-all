import { appUrl } from '@exyconn/shell/config/apps';

/**
 * Where the OpenAI key the agents read free text with is kept. It is a platform credential, so
 * it stays in the Tech portal's vault; the console links across to it.
 */
export const OPENAI_SETTINGS_URL = appUrl('tech', '/tech/environment-variables/openai');
