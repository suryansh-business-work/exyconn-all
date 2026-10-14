import { useT } from '@exyconn/i18n';
import type { GraphIssue, WaNode } from '@exyconn/wa-flow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Text,
} from '@exyconn/shell/components/ui';
import type { NodeFormEnv } from './inspector/fields/form-types';
import { Inspector } from './panels/Inspector';
import { ValidationPanel } from './panels/ValidationPanel';

interface EditorSidePanelProps {
  issues: readonly GraphIssue[];
  errors: number;
  selected: WaNode | undefined;
  isStart: boolean;
  env: NodeFormEnv;
  onPick: (nodeId: string) => void;
  onApply: (data: WaNode['data']) => void;
  onSetStart: () => void;
  onDelete: () => void;
  onClose: () => void;
  /** The validation list is left out where it has its own place (the phone's drawer). */
  showProblems?: boolean;
}

/** Problems (open while there are errors) above the selected node's inspector. */
export function EditorSidePanel(props: Readonly<EditorSidePanelProps>) {
  const t = useT();
  const { issues, errors, selected, showProblems = true } = props;
  return (
    <Box>
      {showProblems && (
        <Accordion disableGutters defaultExpanded={errors > 0} square>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Text size="sm" weight="semibold">
              {t('Problems ({count})', { count: issues.length })}
            </Text>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <ValidationPanel issues={issues} onPick={props.onPick} />
          </AccordionDetails>
        </Accordion>
      )}
      {selected ? (
        <Inspector
          node={selected}
          isStart={props.isStart}
          env={props.env}
          onApply={props.onApply}
          onSetStart={props.onSetStart}
          onDelete={props.onDelete}
          onClose={props.onClose}
        />
      ) : (
        <Text size="sm" color="text.secondary" component="p" sx={{ p: 2 }}>
          {t('Select a node to edit it, or add one from the palette.')}
        </Text>
      )}
    </Box>
  );
}
