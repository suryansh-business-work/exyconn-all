import { lazy, Suspense } from 'react';
import { Box, Skeleton } from '@exyconn/ui';
import type { CodeEditorProps } from './types';

// Monaco is several megabytes, so it loads only when a code field is on screen.
const MonacoPane = lazy(() => import('./MonacoPane'));

/**
 * A code field: Monaco with syntax highlighting, Format (Shift+Alt+F) and a live list of the
 * problems it finds — JSON and CSS by Monaco's own language services, HTML and MJML by a tag
 * check. The value is a plain string.
 */
export function CodeEditor(props: Readonly<CodeEditorProps>) {
  const height = props.height ?? 240;
  return (
    <Suspense
      fallback={
        <Box aria-busy="true" aria-label={props.label}>
          <Skeleton variant="rectangular" height={height + 32} />
        </Box>
      }
    >
      <MonacoPane {...props} />
    </Suspense>
  );
}
