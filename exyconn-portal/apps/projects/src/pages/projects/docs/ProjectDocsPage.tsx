import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button, Flex, Grid, Text } from '@exyconn/shell/components/ui';
import AddIcon from '@mui/icons-material/Add';
import { useProjectDocs } from './useProjectDocs';
import { DocTree } from './DocTree';
import { DocPageEditor } from './DocPageEditor';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';

interface ProjectDocsPageProps {
  projectId: string;
}

/**
 * The project's documentation space: a tree of pages on the left, the open page on the
 * right. Pages nest as deep as a team wants them to, which is what makes this a space rather
 * than a folder of notes.
 */
export function ProjectDocsPage({ projectId }: Readonly<ProjectDocsPageProps>) {
  const docs = useProjectDocs(projectId);
  // A few pixels of travel before a drag starts, so clicking a page still opens it.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Hold to drag on a touch screen, so scrolling the list does not reorder it.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over) {
      docs.reorderPage(String(active.id), String(over.id));
    }
  };

  if (docs.loading && docs.pages.length === 0) {
    return <LoadingState />;
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4, lg: 3 }}>
        <Flex direction="row" alignItems="center" sx={{ mb: 1 }}>
          <Text size="label" sx={{ flex: 1 }}>
            Pages
          </Text>
          <Button size="small" startIcon={<AddIcon />} onClick={() => docs.addPage(null)}>
            New page
          </Button>
        </Flex>

        {docs.pages.length === 0 ? (
          <Text size="sm" color="text.secondary">
            No pages yet. Start the space with one.
          </Text>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            {/* Every page of the space is sortable, at whatever depth it sits: the drop rule
                decides whether a drop reorders within a parent or re-files under another. */}
            <SortableContext
              items={docs.pages.map((page) => page.id)}
              strategy={verticalListSortingStrategy}
            >
              <DocTree
                nodes={docs.tree}
                selectedId={docs.selectedId}
                onSelect={docs.setSelectedId}
                onAddChild={(parentId) => docs.addPage(parentId)}
              />
            </SortableContext>
          </DndContext>
        )}
      </Grid>

      <Grid size={{ xs: 12, md: 8, lg: 9 }}>
        {docs.selectedId === null ? (
          <Text size="sm" color="text.secondary">
            Pick a page to read or edit it.
          </Text>
        ) : (
          <DocPageEditor
            key={docs.selectedId}
            pageId={docs.selectedId}
            trail={docs.trail}
            onSave={docs.savePage}
            onDelete={docs.removePage}
            onCancel={() => docs.setSelectedId(null)}
          />
        )}
      </Grid>
    </Grid>
  );
}
