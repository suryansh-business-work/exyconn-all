import { FormProvider, useForm } from 'react-hook-form';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useT } from '@exyconn/i18n';
import { Box, Button } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { toolCallSchema, type ToolCallValues } from './tool-call.types';

interface ToolCallFormProps {
  /** The arguments the form opens with: an example built from the tool's own schema. */
  initialArgs: string;
  busy: boolean;
  onRun: (args: Record<string, unknown>) => void;
}

/** The arguments to run one read-only tool with, as JSON, and the button that runs it. */
export function ToolCallForm({ initialArgs, busy, onRun }: Readonly<ToolCallFormProps>) {
  const t = useT();
  const form = useForm<ToolCallValues>({
    resolver: zodResolver(toolCallSchema),
    defaultValues: { args: initialArgs },
    mode: 'onTouched',
  });
  const submit = (values: ToolCallValues) => {
    onRun(JSON.parse(values.args) as Record<string, unknown>);
  };
  return (
    <FormProvider {...form}>
      <Box
        component="form"
        noValidate
        sx={{ display: 'grid', gap: 2 }}
        onSubmit={form.handleSubmit(submit)}
      >
        <RhfTextField
          name="args"
          label="Arguments (JSON)"
          helperText="The tool's inputs as one JSON object. Leave {} when it takes none."
          multiline
          minRows={3}
          slotProps={{ htmlInput: { spellCheck: false, style: { fontFamily: 'monospace' } } }}
        />
        <Button type="submit" variant="contained" startIcon={<PlayArrowIcon />} disabled={busy}>
          {t('Run tool')}
        </Button>
      </Box>
    </FormProvider>
  );
}
