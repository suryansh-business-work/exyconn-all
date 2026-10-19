import { useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { CodeEditor, type CodeEditorApi, type CodeProblem } from '@exyconn/code-editor';
import { Flex, Text } from '@exyconn/shell/components/ui';
import { VariablePicker } from '../personalize/VariablePicker';
import type { CampaignStudioValues } from '../campaign.types';
import type { StudioOptions } from '../studio/useStudioOptions';
import type { CampaignPreview } from './useCampaignPreview';

interface CodePaneProps {
  variables: StudioOptions['variables'];
  preview: CampaignPreview | null;
}

const EDITOR_HEIGHT = 560;

/**
 * The MJML source in Monaco: highlighting, line numbers, auto-indent, find and replace
 * (Ctrl/Cmd+F, Ctrl/Cmd+H), undo/redo and Format, with the server's compile errors marked
 * on their lines and variables inserted at the cursor.
 */
export function CodePane({ variables, preview }: Readonly<CodePaneProps>) {
  const t = useT();
  const { control } = useFormContext<CampaignStudioValues>();
  const editor = useRef<CodeEditorApi | null>(null);
  const problems: CodeProblem[] = (preview?.issues ?? []).map((issue) => ({
    line: issue.line,
    column: 1,
    message: issue.message,
    severity: 'error',
  }));
  return (
    <Flex direction="column" spacing={1}>
      <Flex
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        flexWrap="wrap"
      >
        <Text size="caption" color="text.secondary">
          {t(
            'Unsubscribe and preference links are added in a standard footer unless your MJML includes both.',
          )}
        </Text>
        <VariablePicker
          variables={variables}
          onInsert={(text) => editor.current?.insertAtCursor(text)}
        />
      </Flex>
      <Controller
        name="mjml"
        control={control}
        render={({ field, fieldState }) => (
          <CodeEditor
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            language="html"
            label={t('MJML source')}
            height={EDITOR_HEIGHT}
            error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
            problems={problems}
            onReady={(api) => {
              editor.current = api;
            }}
          />
        )}
      />
    </Flex>
  );
}
