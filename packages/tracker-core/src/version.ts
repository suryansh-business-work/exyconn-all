/**
 * Whether `candidate` is a newer release than `current`, comparing `major.minor.patch`
 * numerically — "1.10.0" is newer than "1.9.8", which a string comparison gets wrong. A version
 * that is not three numbers is never "newer": an update check must not nag about a build it
 * cannot even read.
 */
export function isNewerVersion(candidate: string, current: string): boolean {
  const next = parseVersion(candidate);
  const now = parseVersion(current);
  if (next === null || now === null) {
    return false;
  }
  for (let index = 0; index < 3; index += 1) {
    if (next[index] !== now[index]) {
      return next[index] > now[index];
    }
  }
  return false;
}

function parseVersion(value: string): [number, number, number] | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value.trim());
  if (match === null) {
    return null;
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}
