import { z } from 'zod';

/**
 * The longest body a document or contract may hold, in characters of HTML — the server's
 * `LEGAL_BODY_MAX_CHARS`, checked here first so the person hears it before the save fails.
 */
const LEGAL_BODY_MAX_CHARS = 500_000;

/** A Legal document's text: rich-text HTML, optional, and capped. */
export const legalBody = z
  .string()
  .max(LEGAL_BODY_MAX_CHARS, 'This document is too long to save. Split it into two.');
