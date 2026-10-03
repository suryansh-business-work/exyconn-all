import {
  between,
  fillCloud,
  inSphere,
  jitter,
  pickIndex,
  type Cloud,
  type Random,
  type Vec3,
} from "./sampling";

/**
 * LLMs: a loose ribbon of tokens (tag 1) flows into a dense volume (tag 2) and leaves as an
 * ordered line (tag 3).
 */
export interface TokenStreamParams {
  /** Tokens on each side of the volume. */
  tokens?: number;
}

export const TOKEN_STREAM_BOUNDS: Vec3 = [2.4, 1, 1];
export const TOKENS_IN = 1;
export const TOKENS_VOLUME = 2;
export const TOKENS_OUT = 3;

const tokenIn = (random: Random, tokens: number): Vec3 => {
  const slot = pickIndex(random, tokens);
  const x = -2.3 + (slot / tokens) * 1.4;
  return jitter(random, [x, 0.35 * Math.sin(x * 3), 0.25 * Math.cos(x * 2)], 0.05);
};

const tokenOut = (random: Random, tokens: number): Vec3 => {
  const slot = pickIndex(random, tokens);
  return [0.95 + (slot / tokens) * 1.4 + between(random, -0.03, 0.03), 0, 0];
};

export const sampleTokenStream = (
  count: number,
  random: Random,
  params: TokenStreamParams = {}
): Cloud => {
  const tokens = Math.max(2, Math.round(params.tokens ?? 14));
  return fillCloud(
    count,
    [
      { weight: 0.3, tag: TOKENS_IN, sample: (r) => tokenIn(r, tokens) },
      { weight: 0.45, tag: TOKENS_VOLUME, sample: (r) => inSphere(r, 0.75) },
      { weight: 0.25, tag: TOKENS_OUT, sample: (r) => tokenOut(r, tokens) },
    ],
    random
  );
};
