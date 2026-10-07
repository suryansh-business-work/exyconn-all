/** Rendering against a context whose translation marks every string it touched with "~". */
import { createDummy } from '../../../src/engine/dummy';
import { renderNode } from '../../../src/engine/render';
import { scopeOf } from '../../../src/engine/template';
import type { BotContent } from '../../../src/messages';
import type { WaNode } from '../../../src/schema';
import { makeCtx, NOW } from './fixtures';

const ctx = makeCtx({ t: (s) => `~${s}` });

/** Renders a node in workflow `wf` with `name` and `fee` set, plus `vars`. */
export function render(
  n: Omit<WaNode, 'position'>,
  vars: Record<string, string> = {},
): BotContent[] {
  return renderNode({ ...n, position: { x: 0, y: 0 } } as WaNode, {
    workflow: 'wf',
    scope: scopeOf({ name: 'Asha', fee: '400', ...vars }, ctx),
    ctx,
    data: createDummy(5, NOW),
  });
}
