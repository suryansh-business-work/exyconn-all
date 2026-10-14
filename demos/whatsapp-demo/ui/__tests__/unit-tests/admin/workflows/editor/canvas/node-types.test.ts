import { NODE_TYPES } from '@exyconn/wa-flow';
import { FLOW_NODE_TYPES } from '../../../../../../src/admin/workflows/editor/canvas/node-types';
import { FlowNodeCard } from '../../../../../../src/admin/workflows/editor/canvas/FlowNodeCard';
import { PALETTE_MIME } from '../../../../../../src/admin/workflows/editor/canvas/palette-drag';

describe('FLOW_NODE_TYPES', () => {
  it('draws every WhatsApp node type with the memoised card', () => {
    expect(Object.keys(FLOW_NODE_TYPES).sort((a, b) => a.localeCompare(b))).toEqual(
      [...NODE_TYPES].sort((a, b) => a.localeCompare(b)),
    );
    for (const type of NODE_TYPES) {
      expect(FLOW_NODE_TYPES[type]).toBe(FlowNodeCard);
    }
  });

  it('uses a private MIME type for palette drags', () => {
    expect(PALETTE_MIME).toBe('application/x-wa-node-type');
  });
});
