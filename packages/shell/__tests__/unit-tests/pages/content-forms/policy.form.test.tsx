import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  PolicyAudience,
  PolicyCategory,
  PolicyClassification,
  PolicyStatus,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
} from '@/graphql/generated';
import { PolicyForm, type PolicyRow } from '@/pages/content-forms';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple } from '../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useCreatePolicyMutation: vi.fn(),
  useUpdatePolicyMutation: vi.fn(),
}));

interface EditorStubProps {
  value: string;
  label: string;
  error?: string;
  onChange: (html: string) => void;
}

// The editor is a contenteditable library with its own tests; a textarea stands in for it.
vi.mock('@exyconn/rich-text', () => ({
  RichTextEditor: ({ value, label, error, onChange }: Readonly<EditorStubProps>) => (
    <label>
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <span>{error}</span>}
    </label>
  ),
}));

const create = vi.fn();
const update = vi.fn();
const effectiveIso = new Date(2026, 3, 15).toISOString();

const policy: PolicyRow = {
  id: 'pol-1',
  title: 'Acceptable use',
  slug: 'acceptable-use',
  summary: 'How company devices may be used',
  body: '<p>Be sensible.</p>',
  audience: PolicyAudience.Public,
  category: PolicyCategory.It,
  status: PolicyStatus.Draft,
  version: 1,
  effectiveDate: effectiveIso,
  requiresAcknowledgement: true,
  owner: 'IT',
  classification: PolicyClassification.Public,
  nextReviewOn: null,
  reviewOverdue: false,
  approvedByName: '',
  approvedOn: null,
  publishedAt: null,
  updatedAt: '2026-04-01T00:00:00.000Z',
  acknowledgedCount: 0,
};

function renderForm(initial: PolicyRow | null, categories?: readonly PolicyCategory[]) {
  const onDone = vi.fn();
  renderWithProviders(
    <PolicyForm initial={initial} onDone={onDone} onCancel={vi.fn()} categories={categories} />,
  );
  return onDone;
}

async function enter(label: string, value: string) {
  await userEvent.click(screen.getByRole('textbox', { name: label }));
  await userEvent.paste(value);
}

const save = (name: string) => userEvent.click(screen.getByRole('button', { name }));

beforeEach(() => {
  create.mockReset().mockResolvedValue({ data: {} });
  update.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useCreatePolicyMutation).mockReturnValue(mutationTuple(create) as never);
  vi.mocked(useUpdatePolicyMutation).mockReturnValue(mutationTuple(update) as never);
});

describe('PolicyForm', () => {
  it('starts a new policy as General, internal and for all staff', () => {
    renderForm(null);
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('General');
    expect(screen.getByRole('combobox', { name: 'Audience' })).toHaveTextContent('All Staff');
    expect(screen.getByRole('combobox', { name: 'Classification' })).toHaveTextContent('Internal');
  });

  it("starts as the screen's first kind when General is not offered", () => {
    renderForm(null, [PolicyCategory.It, PolicyCategory.Security]);
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('It');
  });

  it('needs a title, slug, body and effective date', async () => {
    renderForm(null);
    await save('Create');

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Slug is required')).toBeInTheDocument();
    expect(screen.getByText('The policy cannot be empty')).toBeInTheDocument();
    expect(screen.getByText('Effective date is required')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('keeps the slug URL-safe', async () => {
    renderForm(null);
    await enter('Slug', 'Acceptable Use');
    await save('Create');
    expect(
      await screen.findByText('Lower-case letters, numbers and hyphens only'),
    ).toBeInTheDocument();
  });

  it('creates a draft policy from what was entered', async () => {
    const onDone = renderForm(null);
    await enter('Title', 'Leave policy');
    await enter('Slug', 'leave-policy');
    await enter('Policy', '<p>Twelve days.</p>');
    fireEvent.change(document.querySelector('input[name="effectiveDate"]') as HTMLInputElement, {
      target: { value: '04/15/2026' },
    });
    await save('Create');

    expect(await screen.findByText('Policy created')).toBeInTheDocument();
    expect(create).toHaveBeenCalledWith({
      variables: {
        input: {
          title: 'Leave policy',
          slug: 'leave-policy',
          summary: '',
          body: '<p>Twelve days.</p>',
          audience: PolicyAudience.AllStaff,
          category: PolicyCategory.General,
          effectiveDate: effectiveIso,
          requiresAcknowledgement: false,
          owner: '',
          classification: PolicyClassification.Internal,
          nextReviewOn: '',
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('saves an existing policy with its own values', async () => {
    const onDone = renderForm(policy);
    await save('Update');

    expect(await screen.findByText('Policy updated')).toBeInTheDocument();
    expect(update).toHaveBeenCalledWith({
      variables: {
        id: 'pol-1',
        input: {
          title: 'Acceptable use',
          slug: 'acceptable-use',
          summary: 'How company devices may be used',
          body: '<p>Be sensible.</p>',
          audience: PolicyAudience.Public,
          category: PolicyCategory.It,
          effectiveDate: effectiveIso,
          requiresAcknowledgement: true,
          owner: 'IT',
          classification: PolicyClassification.Public,
          nextReviewOn: '',
        },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('reports a save the server refuses', async () => {
    update.mockRejectedValueOnce(new Error('Slug already taken'));
    const onDone = renderForm({ ...policy, nextReviewOn: '2027-04-01T00:00:00.000Z' });
    await save('Update');
    expect(await screen.findByText('Slug already taken')).toBeInTheDocument();
    expect(update.mock.calls[0][0].variables.input.nextReviewOn).toBe('2027-04-01T00:00:00.000Z');
    expect(onDone).not.toHaveBeenCalled();
  });
});
