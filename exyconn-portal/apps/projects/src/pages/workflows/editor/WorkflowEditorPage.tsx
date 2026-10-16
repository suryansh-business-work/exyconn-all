import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Chip, Flex, Grid, Heading, Text } from '@exyconn/shell/components/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/EditOutlined';
import SaveIcon from '@mui/icons-material/SaveOutlined';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import {
  ChartSkeleton,
  PageHeaderSkeleton,
  SkeletonStatus,
} from '@exyconn/shell/components/feedback/skeletons';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { WorkflowForm } from '../forms/workflow';
import { useWorkflowMutations } from '../useWorkflowMutations';
import { useWorkflowEditor } from './useWorkflowEditor';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowPalette } from './WorkflowPalette';
import { WorkflowInspector } from './WorkflowInspector';

const LIST_PATH = '/projects/workflows';

/**
 * One workflow, drawn: Tools > Workflows > <name>. The canvas holds the drawing, the side
 * panel names what is selected, and nothing reaches the server until Save — the server
 * then checks the whole drawing and says which rule, if any, it breaks.
 */
export function WorkflowEditorPage() {
  const t = useT();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const editor = useWorkflowEditor(id);
  const { update } = useWorkflowMutations();
  const [editing, setEditing] = useState(false);
  const { workflow } = editor;

  if (editor.loading) {
    return (
      <SkeletonStatus>
        <PageHeaderSkeleton />
        <ChartSkeleton height={480} />
      </SkeletonStatus>
    );
  }
  if (editor.error || !workflow) {
    return (
      <Alert severity="error">{errorMessage(editor.error, 'Could not load the workflow')}</Alert>
    );
  }

  const back = async () => {
    const leave =
      !editor.dirty ||
      (await confirm({
        message: 'Leave without saving? Your changes to this workflow will be lost.',
        confirmText: 'Leave',
      }));
    if (leave) {
      navigate(LIST_PATH);
    }
  };

  return (
    <Flex direction="column" spacing={2}>
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={back} size="small" sx={{ mb: 1 }}>
          {t('Workflows')}
        </Button>
        <Flex direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Heading level={4} sx={{ overflowWrap: 'anywhere' }}>
            {workflow.name}
          </Heading>
          {editor.dirty ? <Chip size="small" color="warning" label={t('Unsaved changes')} /> : null}
          <Box sx={{ flex: 1 }} />
          <Button size="small" startIcon={<EditIcon />} onClick={() => setEditing(true)}>
            {t('Edit details')}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            disabled={!editor.dirty || editor.saving}
            onClick={editor.save}
          >
            {t('Save')}
          </Button>
        </Flex>
        {workflow.description ? (
          <Text size="sm" color="text.secondary">
            {workflow.description}
          </Text>
        ) : null}
      </Box>

      <WorkflowPalette hasStart={editor.hasStart} onAdd={editor.addNode} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 9 }}>
          <WorkflowCanvas
            nodes={editor.nodes}
            edges={editor.edges}
            onNodesChange={editor.onNodesChange}
            onEdgesChange={editor.onEdgesChange}
            onConnect={editor.onConnect}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <WorkflowInspector
            node={editor.selectedNode}
            edge={editor.selectedEdge}
            onRename={editor.renameNode}
            onLabelEdge={editor.labelEdge}
            onRemove={editor.removeSelected}
            onDeselect={editor.deselect}
          />
        </Grid>
      </Grid>

      <CrudDialog open={editing} title={t('Edit details')} onClose={() => setEditing(false)}>
        <WorkflowForm
          initial={{ name: workflow.name, description: workflow.description }}
          onSubmit={async (details) => {
            if (await update(workflow.id, details)) {
              setEditing(false);
            }
          }}
          onCancel={() => setEditing(false)}
        />
      </CrudDialog>
    </Flex>
  );
}
