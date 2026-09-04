import { Box, Button, CircularProgress, Divider, Flex, Text } from '@exyconn/shell/components/ui';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useDocPageQuery, type DocPageFieldsFragment } from '@exyconn/shell/graphql/generated';
import { DocPageForm } from '../forms/doc-page';

interface DocPageEditorProps {
  pageId: string;
  /** Ancestors, root first, for the breadcrumb over the page. */
  trail: DocPageFieldsFragment[];
  onSave: (id: string, values: { title: string; body: string }) => Promise<void>;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

/** One page of the space: where it sits, who touched it last, and its editor. */
export function DocPageEditor({
  pageId,
  trail,
  onSave,
  onDelete,
  onCancel,
}: Readonly<DocPageEditorProps>) {
  const confirm = useConfirm();
  const { formatDateTime } = useSettings();
  const { data, loading } = useDocPageQuery({
    variables: { id: pageId },
    fetchPolicy: 'cache-and-network',
  });

  const page = data?.docPage;

  if (loading && !page) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!page) {
    return <Text color="text.secondary">This page has been deleted.</Text>;
  }

  const remove = async () => {
    const ok = await confirm({
      message: `Delete "${page.title}" and every page under it?`,
      confirmText: 'Delete',
    });
    if (ok) {
      onDelete(page.id);
    }
  };

  const lastEditor = page.updatedByName === '' ? 'nobody yet' : page.updatedByName;

  return (
    <Box>
      <Flex direction="row" alignItems="center" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
        <Text size="caption" color="text.secondary">
          {trail.map((step) => step.title).join(' / ')}
        </Text>
        <Box sx={{ flex: 1 }} />
        <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={remove}>
          Delete page
        </Button>
      </Flex>
      <Text size="caption" color="text.secondary">
        Last saved by {lastEditor} · {formatDateTime(page.updatedAt)}
      </Text>
      <Divider sx={{ my: 2 }} />

      <DocPageForm page={page} onSubmit={(values) => onSave(page.id, values)} onCancel={onCancel} />
    </Box>
  );
}
