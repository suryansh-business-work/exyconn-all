import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RhfAutocomplete,
  RhfDatePicker,
  RhfRichText,
  RhfSelect,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { RhfAttachmentPicker } from '@exyconn/shell/components/upload';
import { Grid, Text } from '@exyconn/shell/components/ui';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  BugSeverity,
  BugStatus,
  useCreateBugMutation,
  useListEmployeeOptionsQuery,
  useListProjectsQuery,
  useUpdateBugMutation,
} from '@exyconn/shell/graphql/generated';
import { bugSchema, toInitial, toInput, type BugValues } from './bug.schema';
import type { BugRow } from './bug.types';

/** Where a bug's screenshots and recordings land on the CDN. */
const BUG_UPLOAD_FOLDER = 'bugs';

interface BugFormProps {
  initial: BugRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form to report or update a bug. Only what a bug cannot be worked
 * without is required — a title, a project and a description; everything else helps.
 */
export function BugForm({ initial, onDone, onCancel }: Readonly<BugFormProps>) {
  const [createBug] = useCreateBugMutation();
  const [updateBug] = useUpdateBugMutation();
  const { data: projectData } = useListProjectsQuery();
  const { data: employeeData } = useListEmployeeOptionsQuery();
  const methods = useForm({
    mode: 'onTouched',
    resolver: zodResolver(bugSchema),
    defaultValues: toInitial(initial),
  });

  const projectOptions = (projectData?.listProjects ?? []).map((project) => ({
    value: project.id,
    label: `${project.key} · ${project.name}`,
  }));
  const assigneeOptions = (employeeData?.listEmployeeOptions ?? []).map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Bug',
    initial,
    create: (values: BugValues) => createBug({ variables: { input: toInput(values) } }),
    update: (row, values) => updateBug({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <Text size="sm" color="text.secondary">
        Report a bug with clear details so it can be fixed faster. Fields marked * are required.
      </Text>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <RhfTextField
            name="title"
            label="Title"
            required
            placeholder="e.g. Login fails with a 500 error on mobile"
            helperText="Keep it short and specific: what breaks, and where."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RhfAutocomplete
            name="projectId"
            label="Project"
            required
            options={projectOptions}
            helperText="The project the bug was found in. Needed to promote it to a ticket."
          />
        </Grid>
        <Grid size={12}>
          <RhfRichText
            name="description"
            label="Description"
            required
            folder={BUG_UPLOAD_FOLDER}
            minHeight={140}
            placeholder="What were you doing, what did you expect, and what happened instead?"
            helperText="Include the details that help someone reproduce and fix it: browser, device, account, error text."
          />
        </Grid>
        <Grid size={12}>
          <RhfRichText
            name="stepsToReproduce"
            label="Steps to reproduce"
            folder={BUG_UPLOAD_FOLDER}
            minHeight={120}
            placeholder={'1. Open …\n2. Click …\n3. See the error'}
            helperText="Number each step, from a fresh start to the moment it goes wrong."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RhfTextField
            name="publicLink"
            label="Public link"
            placeholder="https://"
            helperText="Visible to everyone, e.g. the live page, a Figma design or a demo."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RhfTextField
            name="privateLink"
            label="Private link"
            placeholder="https://"
            helperText="For the team only, e.g. a staging URL, an internal doc or a ticket."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RhfSelect
            name="severity"
            label="Severity"
            required
            options={enumOptions(Object.values(BugSeverity))}
            helperText="How badly it hurts: Critical blocks people from working."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RhfSelect
            name="status"
            label="Status"
            required
            options={enumOptions(Object.values(BugStatus))}
            helperText="New bugs start Open."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RhfAutocomplete
            name="assigneeId"
            label="Assignee"
            options={assigneeOptions}
            helperText="Who will fix it. Leave empty to triage later."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <RhfDatePicker
            name="dueDate"
            label="Due date"
            helperText="Optional. Assignees are reminded once it passes."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Text size="sm" weight="medium" sx={{ mb: 1 }}>
            Attachments
          </Text>
          <RhfAttachmentPicker name="attachments" folder={BUG_UPLOAD_FOLDER} />
        </Grid>
      </Grid>
    </EntityForm>
  );
}
