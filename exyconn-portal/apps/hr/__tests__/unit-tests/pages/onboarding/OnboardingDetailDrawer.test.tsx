import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_FORMAT_SETTINGS, formatDate } from '@exyconn/i18n';
import { OnboardingDetailDrawer } from '../../../../src/pages/onboarding/OnboardingDetailDrawer';
import type { PagedOnboardingChecklistRow } from '../../../../src/pages/onboarding/onboarding-grid';
import { renderWithProviders } from '../../test-utils';
import { checklist } from './onboarding-fixture';

const gql = vi.hoisted(() => ({ setItem: vi.fn(), loading: false }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSetOnboardingItemMutation: () => [gql.setItem, { loading: gql.loading }],
}));

function renderDrawer(row: PagedOnboardingChecklistRow | null = checklist()) {
  const onClose = vi.fn();
  const onChanged = vi.fn();
  renderWithProviders(
    <OnboardingDetailDrawer checklist={row} onClose={onClose} onChanged={onChanged} />,
  );
  return { onClose, onChanged };
}

describe('OnboardingDetailDrawer', () => {
  beforeEach(() => {
    gql.setItem.mockReset();
    gql.loading = false;
  });

  it('renders nothing while no checklist is open', () => {
    renderDrawer(null);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it("names the joiner, the template and the join date over the checklist's tasks", () => {
    renderDrawer();
    const joined = formatDate('2026-03-02T12:00:00.000Z', DEFAULT_FORMAT_SETTINGS);

    expect(screen.getByRole('heading', { name: 'Asha Rao — onboarding' })).toBeInTheDocument();
    expect(screen.getByText(`Engineering joiner · joined ${joined}`)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Issue laptop' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Sign the policy' })).not.toBeChecked();
  });

  it("lets HR tick the joiner's own task and hands back the updated checklist", async () => {
    const updated = checklist({ progressPercent: 100, complete: true });
    gql.setItem.mockResolvedValue({ data: { setOnboardingItem: updated } });
    const { onChanged } = renderDrawer();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Sign the policy' }));

    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(updated));
    expect(gql.setItem).toHaveBeenCalledWith({
      variables: { checklistId: 'checklist-1', key: 'policy', done: true },
    });
  });

  it('unticks a finished task', async () => {
    gql.setItem.mockResolvedValue({ data: { setOnboardingItem: checklist() } });
    renderDrawer();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Issue laptop' }));

    await waitFor(() =>
      expect(gql.setItem).toHaveBeenCalledWith({
        variables: { checklistId: 'checklist-1', key: 'laptop', done: false },
      }),
    );
  });

  it('keeps the checklist as it was when the server returns nothing', async () => {
    gql.setItem.mockResolvedValue({ data: null });
    const { onChanged } = renderDrawer();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Sign the policy' }));

    await waitFor(() => expect(gql.setItem).toHaveBeenCalledTimes(1));
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("says why a tick failed, in the server's words", async () => {
    gql.setItem.mockRejectedValue(new Error('Checklist is closed'));
    const { onChanged } = renderDrawer();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Sign the policy' }));

    expect(await screen.findByText('Checklist is closed')).toBeInTheDocument();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    gql.setItem.mockRejectedValue('offline');
    renderDrawer();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Sign the policy' }));

    expect(await screen.findByText('Could not update the task')).toBeInTheDocument();
  });

  it('locks the ticks while a change is saving', () => {
    gql.loading = true;
    renderDrawer();

    expect(screen.getByRole('checkbox', { name: 'Sign the policy' })).toBeDisabled();
  });

  it('closes from its close button', async () => {
    const { onClose } = renderDrawer();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
