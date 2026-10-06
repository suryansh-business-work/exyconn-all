import type { CmsSeedPage } from '../../types';
import { AI_AGENTIC_PAGE } from './ai/agentic';
import { AI_LLMS_PAGE } from './ai/llms';
import { AI_MODELS_PAGE } from './ai/models';
import { AI_CUSTOM_MODEL_TRAINING_PAGE } from './ai/custom-model-training';
import { AI_MCP_SERVER_PAGE } from './ai/mcp-server';
import { AI_WORKFLOWS_PAGE } from './ai/workflows';
import { AI_BOT_CREATION_PAGE } from './ai/bot-creation';
import { AI_HUB_PAGE } from './ai/hub';

/** The AI hub and every AI capability page (/ai, /ai/*). */
export const AI_PAGES: CmsSeedPage[] = [
  AI_AGENTIC_PAGE,
  AI_LLMS_PAGE,
  AI_MODELS_PAGE,
  AI_CUSTOM_MODEL_TRAINING_PAGE,
  AI_MCP_SERVER_PAGE,
  AI_WORKFLOWS_PAGE,
  AI_BOT_CREATION_PAGE,
  AI_HUB_PAGE,
];
