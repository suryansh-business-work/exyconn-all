import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { I18nProvider } from '@exyconn/i18n';
import { BoolChip } from '@/components/data/BoolChip';
import { StatusChip } from '@/components/data/StatusChip';
import { DetailFact, DetailFactGrid } from '@/components/data/DetailFact';
import { DetailRow } from '@/components/data/DetailRow';
import { CrudDialog } from '@/components/data/CrudDialog';

function renderIn(ui: ReactElement, messages: Record<string, string> = {}) {
  return render(
    <I18nProvider locale="en" messages={messages}>
      {ui}
    </I18nProvider>,
  );
}

function chipOf(text: string): HTMLElement {
  const chip = screen.getByText(text).closest('.MuiChip-root');
  if (!(chip instanceof HTMLElement)) throw new Error(`no chip for ${text}`);
  return chip;
}

describe('BoolChip', () => {
  it('reads Yes in green and No in grey, translated', () => {
    renderIn(
      <>
        <BoolChip value />
        <BoolChip value={false} />
      </>,
      { Yes: 'Sí' },
    );
    expect(chipOf('Sí')).toHaveClass('MuiChip-colorSuccess');
    expect(chipOf('No')).toHaveClass('MuiChip-colorDefault');
  });
});

describe('StatusChip', () => {
  it('colour-codes portal enums and shows them as words', () => {
    renderIn(
      <>
        <StatusChip value="PAID" />
        <StatusChip value="IN_PROGRESS" />
        <StatusChip value="OVERDUE" />
        <StatusChip value="CLIENT" />
        <StatusChip value="OPEN" />
      </>,
      { 'IN PROGRESS': 'En curso' },
    );
    expect(chipOf('PAID')).toHaveClass('MuiChip-colorSuccess');
    expect(chipOf('En curso')).toHaveClass('MuiChip-colorWarning');
    expect(chipOf('OVERDUE')).toHaveClass('MuiChip-colorError');
    expect(chipOf('CLIENT')).toHaveClass('MuiChip-colorPrimary');
    expect(chipOf('OPEN')).toHaveClass('MuiChip-colorInfo');
  });

  it('colours lowercase kebab website statuses off the same map', () => {
    renderIn(<StatusChip value="in-review" />);
    expect(chipOf('in-review')).toHaveClass('MuiChip-colorWarning');
  });

  it('falls back to the default colour for an unknown status', () => {
    renderIn(<StatusChip value="SOMETHING_NEW" />);
    expect(chipOf('SOMETHING NEW')).toHaveClass('MuiChip-colorDefault');
  });
});

describe('DetailFact, DetailFactGrid and DetailRow', () => {
  it('puts a translated label above its value inside a wrapping grid', () => {
    renderIn(
      <DetailFactGrid>
        <DetailFact label="Employment">Active</DetailFact>
        <DetailFact label="Team">Payroll</DetailFact>
      </DetailFactGrid>,
      { Employment: 'Empleo' },
    );
    const label = screen.getByText('Empleo');
    expect(label.nextElementSibling).toHaveTextContent('Active');
    expect(getComputedStyle(label.parentElement?.parentElement as HTMLElement).display).toBe(
      'grid',
    );
  });

  it('lays a label and its value out on one line', () => {
    renderIn(
      <DetailRow label="Owner">
        <strong>Asha</strong>
      </DetailRow>,
    );
    expect(screen.getByText('Owner').nextElementSibling).toHaveTextContent('Asha');
  });
});

describe('CrudDialog', () => {
  it('shows the form under its heading and closes from the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderIn(
      <CrudDialog open title="New lead" onClose={onClose}>
        <p>form body</p>
      </CrudDialog>,
      { Close: 'Cerrar' },
    );

    expect(screen.getByRole('heading', { level: 2, name: 'New lead' })).toBeInTheDocument();
    expect(screen.getByText('form body')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing while closed', () => {
    renderIn(
      <CrudDialog open={false} title="New lead" onClose={vi.fn()}>
        <p>form body</p>
      </CrudDialog>,
    );
    expect(screen.queryByText('form body')).not.toBeInTheDocument();
  });
});
