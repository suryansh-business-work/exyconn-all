/**
 * The prompt template language, re-exported.
 *
 * The implementation is `utils/mergeFields`, shared with marketing's mail merge — same braces,
 * same grammar, and now the same protection against a field name that reaches a prototype
 * member. `PromptVariableInput` keeps its name because the AI schema is written in terms of it.
 */
export {
  extractMergeFields,
  renderMergeFields,
  toValueMap,
  type MergeFieldInput as PromptVariableInput,
} from '../../utils/mergeFields';
