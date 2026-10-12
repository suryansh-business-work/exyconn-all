import type { CmsSeedPage } from '../../types';
import { seedPage } from '../page-doc';
import agentic from './ai/agentic.json';
import llms from './ai/llms.json';
import models from './ai/models.json';
import customModelTraining from './ai/custom-model-training.json';
import mcpServer from './ai/mcp-server.json';
import workflows from './ai/workflows.json';
import botCreation from './ai/bot-creation.json';
import hub from './ai/hub.json';

/** The AI hub and every AI capability page (/ai, /ai/*). */
export const AI_PAGES: CmsSeedPage[] = [
  agentic,
  llms,
  models,
  customModelTraining,
  mcpServer,
  workflows,
  botCreation,
  hub,
].map(seedPage);
