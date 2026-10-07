import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { I18nProvider } from '@exyconn/i18n';
import { CrudFormPage } from '@/components/data/CrudFormPage';

function renderIn(ui: ReactElement, messages: Record<string, string> = {}) {
  return render(
    <I18nProvider locale="en" messages={messages}>
      {ui}
    </I18nProvider>,
  );
}

describe('CrudFormPage', () => {
  it('titles the page and the tab, and goes back with a plain Back link', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    renderIn(
      <CrudFormPage title="Edit {name}" titleValues={{ name: 'Acme' }} onBack={onBack}>
        <p>fields</p>
      </CrudFormPage>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Edit Acme' })).toBeInTheDocument();
    expect(document.title.startsWith('Edit Acme')).toBe(true);
    expect(screen.getByText('fields')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('names the list in the back link and shows a translated subtitle', () => {
    renderIn(
      <CrudFormPage
        title="New lead"
        subtitle="Fill in {count} fields"
        subtitleValues={{ count: 3 }}
        backLabel="Back to {list}"
        backLabelValues={{ list: 'leads' }}
        onBack={vi.fn()}
      >
        <p>fields</p>
      </CrudFormPage>,
      { 'Back to {list}': 'Volver a {list}' },
    );

    expect(screen.getByRole('button', { name: 'Volver a leads' })).toBeInTheDocument();
    expect(screen.getByText('Fill in 3 fields')).toBeInTheDocument();
  });

  it('shows no subtitle when none is given', () => {
    renderIn(
      <CrudFormPage title="New lead" onBack={vi.fn()}>
        <p>fields</p>
      </CrudFormPage>,
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.nextElementSibling).toHaveTextContent('fields');
  });
});
