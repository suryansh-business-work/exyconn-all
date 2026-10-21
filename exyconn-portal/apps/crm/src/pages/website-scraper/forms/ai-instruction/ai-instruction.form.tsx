import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useT } from '@exyconn/i18n';
import { Box, Button } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import {
  aiInstructionSchema,
  DEFAULT_AI_INSTRUCTION,
  type AiInstructionValues,
} from './ai-instruction.types';

interface AiInstructionFormProps {
  /** The last instruction sent for this page, or '' for the default one. */
  initialInstruction: string;
  busy: boolean;
  onSubmit: (instruction: string) => void;
}

/** What to ask the AI about the scraped page. Submitting only prices it; nothing is spent yet. */
export function AiInstructionForm({
  initialInstruction,
  busy,
  onSubmit,
}: Readonly<AiInstructionFormProps>) {
  const t = useT();
  const form = useForm<AiInstructionValues>({
    resolver: zodResolver(aiInstructionSchema),
    defaultValues: { instruction: initialInstruction || t(DEFAULT_AI_INSTRUCTION) },
    mode: 'onTouched',
  });
  return (
    <FormProvider {...form}>
      <Box
        component="form"
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}
        onSubmit={form.handleSubmit((values) => onSubmit(values.instruction))}
      >
        <RhfTextField
          name="instruction"
          label="Instruction for the AI"
          multiline
          minRows={3}
          maxRows={8}
          disabled={busy}
          helperText="3 to 1,000 characters. You see the estimated cost before anything is sent."
          fullWidth
        />
        <Button type="submit" variant="contained" startIcon={<AutoAwesomeIcon />} disabled={busy}>
          {busy ? t('Working…') : t('Send to AI')}
        </Button>
      </Box>
    </FormProvider>
  );
}
