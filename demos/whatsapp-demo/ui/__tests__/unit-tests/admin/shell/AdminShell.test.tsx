import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'react-router-dom';
import { useStudio } from '@exyconn/bot-studio/studio';
import type { AuthUser } from '@exyconn/shell/auth/AuthContext';
import { ROLES } from '@exyconn/shell/auth/roles';
import { AdminShell } from '../../../../src/admin/shell/AdminShell';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';

function EditorStub() {
  return <p>{`Editor for ${useParams().workflowId ?? ''}`}</p>;
}

/** The editor's preview pane: draws what the studio config renders for a workflow. */
function PreviewStub() {
  const { renderPreview, forbidden } = useStudio();
  const bundle = { demo: { key: 'clinic' }, workflows: [] } as unknown as Parameters<
    typeof renderPreview
  >[0];
  return (
    <>
      {renderPreview(bundle, 'booking')}
      {forbidden}
    </>
  );
}

vi.mock('@exyconn/bot-studio/studio', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  AnalyticsTab: () => <p>Analytics tab</p>,
  SessionsTab: () => <p>Sessions tab</p>,
  WorkflowListPage: () => <p>Workflow list</p>,
  WorkflowEditorPage: () => (
    <>
      <EditorStub />
      <PreviewStub />
    </>
  ),
}));
vi.mock('../../../../src/components/wa/preview', () => ({
  ChatPreview: ({ bundle, startWorkflow }: Readonly<{ bundle: { demo: { key: string } }; startWorkflow?: string }>) => (
    <p>{`WhatsApp preview of ${bundle.demo.key} at ${startWorkflow ?? 'menu'}`}</p>
  ),
}));
vi.mock('../../../../src/admin/shell/AdminForbidden', () => ({
  AdminForbidden: () => <p>Forbidden notice</p>,
}));
vi.mock('../../../../src/admin/channel', () => ({ ChannelTab: () => <p>Channel tab</p> }));

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const ADMIN: AuthUser = {
  id: 'u-1',
  name: 'Asha Rao',
  email: 'asha@example.com',
  roles: [ROLES.ADMIN],
};

function mount(route: string) {
  renderWithProviders(
    <>
      <AdminShell user={ADMIN} />
      <Url />
    </>,
    { route, path: '/admin/*' },
  );
}

const url = () => screen.getByRole('status', { name: 'url' });

describe('AdminShell', () => {
  it('lands /admin on Analytics, under the top bar and the four tabs', async () => {
    mount('/admin');
    expect(await screen.findByText('Analytics tab')).toBeInTheDocument();
    expect(url()).toHaveTextContent('/admin/analytics');
    expect(screen.getByRole('heading', { name: 'WhatsApp demo admin' })).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(tabs).toEqual(['Analytics', 'Sessions', 'Bot workflows', 'WhatsApp number']);
  });

  it('switches tabs through the URL', async () => {
    const user = userEvent.setup();
    mount('/admin/analytics');
    await user.click(screen.getByRole('tab', { name: 'Sessions' }));
    expect(await screen.findByText('Sessions tab')).toBeInTheDocument();
    expect(url()).toHaveTextContent('/admin/sessions');
    await user.click(screen.getByRole('tab', { name: 'WhatsApp number' }));
    expect(await screen.findByText('Channel tab')).toBeInTheDocument();
  });

  it('shows the workflow list at /admin/bot-workflows', async () => {
    mount('/admin/bot-workflows');
    expect(await screen.findByText('Workflow list')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Bot workflows' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('opens one workflow in the editor inside the same tab', async () => {
    mount('/admin/bot-workflows/wf-9');
    expect(await screen.findByText('Editor for wf-9')).toBeInTheDocument();
    expect(screen.queryByText('Workflow list')).not.toBeInTheDocument();
    expect(url()).toHaveTextContent('/admin/bot-workflows/wf-9');
  });

  it('previews a workflow in the WhatsApp chat, and refuses with the admin notice', async () => {
    mount('/admin/bot-workflows/wf-9');
    expect(await screen.findByText('WhatsApp preview of clinic at booking')).toBeInTheDocument();
    expect(screen.getByText('Forbidden notice')).toBeInTheDocument();
  });
});
