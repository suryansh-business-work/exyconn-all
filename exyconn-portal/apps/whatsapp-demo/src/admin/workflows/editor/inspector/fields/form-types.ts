import type { NodeOf, NodeType } from '@exyconn/wa-flow';

/** What a node's form needs from outside the node itself. */
export interface NodeFormEnv {
  /** Every workflow key of the demo, for Jump. */
  workflowKeys: readonly string[];
  /** Whether OpenAI is set up, for the AI node's warning. */
  aiConfigured: boolean;
}

/** Props of every per-type inspector form. */
export interface NodeFormProps<T extends NodeType> {
  node: NodeOf<T>;
  env: NodeFormEnv;
  /** Called with the validated data when the author presses Apply. */
  onApply: (data: NodeOf<T>['data']) => void;
}
