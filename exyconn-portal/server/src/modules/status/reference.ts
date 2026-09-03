import { randomInt } from 'node:crypto';

/** Unambiguous alphabet: no O/0 or I/1, so a reference read off a screen cannot be mistyped. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LENGTH = 6;

/** `EXY-4KQ7W2` — short enough to quote on a call, random enough not to collide. */
export function newReference(): string {
  let code = '';
  for (let i = 0; i < LENGTH; i += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `EXY-${code}`;
}
