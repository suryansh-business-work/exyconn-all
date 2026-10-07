import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhatsappWorkflowStatus } from '@exyconn/shell/graphql/generated';
import { EditorHeader } from '../../../../../src/admin/workflows/editor/EditorHeader';
import { renderWithProviders } from '../../../test-utils';

type Props = Parameters<typeof EditorHeader>[0];

function mount(overrides: Partial<Props> = {}) {
  const props: Props = {
    name: 'Book a visit',
    workflowKey: 'book-visit',
    status: WhatsappWorkflowStatus.Draft,
    version: 2,
    dirty: true,
    errors: 0,
    busy: false,
    onBack: vi.fn(),
    onDetails: vi.fn(),
    onTidy: vi.fn(),
    onPreview: vi.fn(),
    onDiscard: vi.fn(),
    onSave: vi.fn(),
    onPublish: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<EditorHeader {...props} />);
  return props;
}

const button = (name: string) => screen.getByRole('button', { name });

describe('EditorHeader', () => {
  it('names the workflow, its key and status, and flags unsaved changes', () => {
    mount();
    expect(screen.getByRole('heading', { name: 'Book a visit', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('book-visit')).toBeInTheDocument();
    expect(screen.getByText('Draft · live v2')).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('runs each action', async () => {
    const user = userEvent.setup();
    const props = mount();
    await user.click(button('Back to workflows'));
    await user.click(button('Edit workflow details'));
    await user.click(button('Tidy up'));
    await user.click(button('Preview in WhatsApp'));
    await user.click(button('Discard draft'));
    await user.click(button('Save draft'));
    await user.click(button('Publish'));
    for (const handler of [
      props.onBack,
      props.onDetails,
      props.onTidy,
      props.onPreview,
      props.onDiscard,
      props.onSave,
      props.onPublish,
    ]) {
      expect(handler).toHaveBeenCalledTimes(1);
    }
  });

  it('holds Publish until the errors are fixed, and says how many', async () => {
    const user = userEvent.setup();
    mount({ errors: 3 });
    expect(button('Publish')).toBeDisabled();
    await user.hover(button('Publish').parentElement as HTMLElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Fix 3 errors to publish');
  });

  it('has nothing to save, discard or publish when the live version is the draft', () => {
    mount({ status: WhatsappWorkflowStatus.Published, dirty: false });
    expect(screen.getByText('Published v2')).toBeInTheDocument();
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    expect(button('Save draft')).toBeDisabled();
    expect(button('Discard draft')).toBeDisabled();
    expect(button('Publish')).toBeDisabled();
  });

  it('lets an edited published workflow be published or discarded again', () => {
    mount({ status: WhatsappWorkflowStatus.Published, dirty: true });
    expect(button('Discard draft')).toBeEnabled();
    expect(button('Publish')).toBeEnabled();
  });

  it('cannot discard a workflow that was never published', () => {
    mount({ version: 0 });
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(button('Discard draft')).toBeDisabled();
    expect(button('Save draft')).toBeEnabled();
  });

  it('locks the actions while one is running', () => {
    mount({ busy: true });
    expect(button('Discard draft')).toBeDisabled();
    expect(button('Save draft')).toBeDisabled();
    expect(button('Publish')).toBeDisabled();
    expect(button('Tidy up')).toBeEnabled();
  });
});
