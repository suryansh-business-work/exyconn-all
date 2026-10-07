import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { ItDecision } from '@exyconn/shell/graphql/generated';
import { DecisionDialog } from '../../../../src/components/decision';
import { press, toast } from '../../core/form.helpers';
import { renderWithProviders } from '../../test-utils';

const onDecide = vi.fn();
const onClose = vi.fn();
const onDecided = vi.fn();

const renderDialog = (title: string | null) =>
  renderWithProviders(
    <DecisionDialog title={title} onDecide={onDecide} onClose={onClose} onDecided={onDecided} />,
  );

describe('DecisionDialog', () => {
  beforeEach(() => {
    onDecide.mockReset().mockResolvedValue({ data: {} });
    onClose.mockReset();
    onDecided.mockReset();
  });

  it('stays closed while nothing is being decided', () => {
    renderDialog(null);
    expect(screen.queryByRole('button', { name: 'Record decision' })).not.toBeInTheDocument();
  });

  it('opens on the record being decided', () => {
    renderDialog('Ana Rao — Slack');
    expect(screen.getByRole('heading', { name: 'Ana Rao — Slack' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Record decision' })).toBeInTheDocument();
  });

  it('records the decision, closes and tells the page to reload', async () => {
    renderDialog('Ana Rao — Slack');
    await press('Record decision');

    await waitFor(() => expect(onDecided).toHaveBeenCalledTimes(1));
    expect(onDecide).toHaveBeenCalledWith({ decision: ItDecision.Approved, note: '' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(await toast()).toHaveTextContent('Approved');
  });

  it('closes from its close button and from Cancel without deciding', async () => {
    renderDialog('Ana Rao — Slack');
    await press('Close');
    await press('Cancel');

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onDecide).not.toHaveBeenCalled();
    expect(onDecided).not.toHaveBeenCalled();
  });
});
