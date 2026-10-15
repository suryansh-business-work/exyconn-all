import type { ComponentType } from 'react';
import type { NodeType, WaNode } from '@exyconn/wa-flow';
import type { NodeFormEnv, NodeFormProps } from './fields/form-types';
import { NODE_FORMS } from './node-forms';

interface SelectedNodeFormProps {
  node: WaNode;
  env: NodeFormEnv;
  onApply: (data: WaNode['data']) => void;
}

/** Renders the selected node's own inspector form. */
export function NodeForm({ node, env, onApply }: Readonly<SelectedNodeFormProps>) {
  const Form = NODE_FORMS[node.type] as ComponentType<Readonly<NodeFormProps<NodeType>>>;
  return <Form node={node} env={env} onApply={onApply} />;
}
