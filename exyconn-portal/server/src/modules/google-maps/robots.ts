import { cutAtFirst } from '../../utils/textTrim';

/**
 * Just enough of robots.txt (RFC 9309) to be a polite visitor: the group for our user agent, or
 * the `*` group when there is none, and the longest matching Allow / Disallow rule wins (an Allow
 * wins a tie). Wildcards are not interpreted; a rule containing one is read up to the `*`, which
 * errs on the side of staying out.
 */

interface Rule {
  allow: boolean;
  path: string;
}

interface Group {
  agents: string[];
  rules: Rule[];
}

/** The groups in a robots.txt, in order. Consecutive User-agent lines share one group. */
function groupsOf(text: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  let collectingAgents = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = cutAtFirst(raw, '#').trim();
    const colon = line.indexOf(':');
    if (colon <= 0) {
      continue;
    }
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (field === 'user-agent') {
      if (!collectingAgents || !current) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      collectingAgents = true;
    } else if ((field === 'allow' || field === 'disallow') && current) {
      collectingAgents = false;
      const path = value.split('*')[0];
      if (path !== '' || field === 'allow') {
        current.rules.push({ allow: field === 'allow', path });
      }
    }
  }
  return groups;
}

/** Whether `path` may be fetched by `agent` under these robots.txt rules. */
export function robotsAllows(robotsTxt: string, agent: string, path: string): boolean {
  const groups = groupsOf(robotsTxt);
  const token = agent.toLowerCase();
  const own = groups.filter((group) =>
    group.agents.some((name) => name !== '*' && token.includes(name)),
  );
  const applicable = own.length > 0 ? own : groups.filter((group) => group.agents.includes('*'));
  let best: Rule | null = null;
  for (const rule of applicable.flatMap((group) => group.rules)) {
    if (!path.startsWith(rule.path)) {
      continue;
    }
    const longer = !best || rule.path.length > best.path.length;
    const tieAllow = rule.allow && rule.path.length === best?.path.length;
    if (longer || tieAllow) {
      best = rule;
    }
  }
  return best?.allow ?? true;
}
