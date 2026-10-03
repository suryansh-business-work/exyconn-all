import type { NodeTypes } from '@xyflow/react';
import { NODE_TYPES as WA_NODE_TYPES } from '@exyconn/wa-flow';
import { FlowNodeCard } from './FlowNodeCard';

/**
 * React Flow's node registry, built once at module scope (a new object per render would
 * remount every node). Every WhatsApp node type is registered under its own name and drawn
 * by the memoised card, which reads the type for its icon, colour, summary and outputs.
 */
export const FLOW_NODE_TYPES: NodeTypes = Object.fromEntries(
  WA_NODE_TYPES.map((type) => [type, FlowNodeCard]),
);
