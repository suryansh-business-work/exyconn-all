import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import CodeIcon from '@mui/icons-material/Code';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import { Button, Flex, Grid, ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { EditorMode } from '@exyconn/shell/graphql/generated';
import { VisualEditor } from '../design/VisualEditor';
import { CodePane } from '../design/CodePane';
import { PreviewPane } from '../design/PreviewPane';
import { TemplatePicker, type PickedTemplate } from '../design/TemplatePicker';
import { designToMjml, starterDesign, type Design } from '../design/blocks';
import { CampaignTemplateForm } from '../../campaign-template';
import type { CampaignPreviewState } from '../design/useCampaignPreview';
import type { CampaignStudioValues } from '../campaign.types';
import type { StudioOptions } from '../studio/useStudioOptions';

interface DesignStepProps {
  options: StudioOptions;
  preview: CampaignPreviewState;
}

type Dialog = 'pick' | 'save' | null;

/** The Email Studio: visual blocks or MJML code on the left, the live preview on the right. */
export function DesignStep({ options, preview }: Readonly<DesignStepProps>) {
  const t = useT();
  const confirm = useConfirm();
  const { control, setValue, getValues } = useFormContext<CampaignStudioValues>();
  const [mode, design] = useWatch({ control, name: ['editorMode', 'design'] });
  const [dialog, setDialog] = useState<Dialog>(null);

  const applyDesign = (next: Design) => {
    setValue('design', next, { shouldDirty: true });
    setValue('mjml', designToMjml(next), { shouldDirty: true, shouldValidate: true });
  };

  const switchMode = async (next: EditorMode) => {
    if (next === mode) return;
    const toVisual = next === EditorMode.Visual;
    const ok = await confirm({
      title: toVisual ? 'Switch to the visual editor?' : 'Switch to code?',
      message: toVisual
        ? 'The MJML will be rebuilt from the visual blocks. Changes made in code will be lost.'
        : 'You can edit the MJML freely. Switching back to visual later rebuilds it from the blocks.',
      confirmText: 'Switch',
      destructive: toVisual,
    });
    if (!ok) return;
    setValue('editorMode', next, { shouldDirty: true });
    if (toVisual) applyDesign(design ?? starterDesign());
  };

  const pick = async ({ editorMode, design: picked, mjml }: PickedTemplate) => {
    const ok = await confirm({
      title: 'Replace this email?',
      message: 'The template replaces the current design.',
      confirmText: 'Use template',
      destructive: true,
    });
    if (!ok) return;
    setDialog(null);
    setValue('editorMode', picked ? editorMode : EditorMode.Code, { shouldDirty: true });
    if (picked) {
      applyDesign(picked);
    } else {
      setValue('mjml', mjml, { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <Flex direction="column" spacing={2}>
      <Flex
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        flexWrap="wrap"
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          aria-label={t('Editor')}
          onChange={(_e, next: EditorMode | null) => next && switchMode(next)}
        >
          <ToggleButton value={EditorMode.Visual}>
            <DashboardCustomizeIcon fontSize="small" sx={{ mr: 0.5 }} />
            {t('Visual')}
          </ToggleButton>
          <ToggleButton value={EditorMode.Code}>
            <CodeIcon fontSize="small" sx={{ mr: 0.5 }} />
            {t('MJML code')}
          </ToggleButton>
        </ToggleButtonGroup>
        <Flex direction="row" gap={1}>
          <Button variant="outlined" onClick={() => setDialog('pick')}>
            {t('Start from template')}
          </Button>
          <Button variant="outlined" onClick={() => setDialog('save')}>
            {t('Save as template')}
          </Button>
        </Flex>
      </Flex>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          {mode === EditorMode.Visual ? (
            <VisualEditor
              design={design ?? starterDesign()}
              onChange={applyDesign}
              variables={options.variables}
            />
          ) : (
            <CodePane variables={options.variables} preview={preview.preview} />
          )}
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <PreviewPane state={preview} />
        </Grid>
      </Grid>
      <CrudDialog
        open={dialog === 'pick'}
        title={t('Start from a template')}
        onClose={() => setDialog(null)}
      >
        {dialog === 'pick' && <TemplatePicker onPick={pick} />}
      </CrudDialog>
      <CrudDialog
        open={dialog === 'save'}
        title={t('Save as template')}
        onClose={() => setDialog(null)}
      >
        {dialog === 'save' && (
          <CampaignTemplateForm
            content={{
              editorMode: getValues('editorMode'),
              blocks: getValues('design'),
              mjml: getValues('mjml'),
            }}
            onDone={() => setDialog(null)}
            onCancel={() => setDialog(null)}
          />
        )}
      </CrudDialog>
    </Flex>
  );
}
