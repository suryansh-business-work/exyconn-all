import type { ChangeEvent, ReactNode } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { ModuleToolbar } from '../../../../src/pages/Portal/ModuleToolbar';
import { renderWithProviders } from '../../test-utils';

interface FieldStubProps {
  label: string;
  value: string;
  select?: boolean;
  children?: ReactNode;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

// MUI's select only ever hands back one of its own options, so the sort field is a native
// <select> here: that lets a value the launcher does not know reach the toolbar's guard.
vi.mock('@exyconn/shell/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/ui')>()),
  TextField: ({ label, value, select, children, onChange }: Readonly<FieldStubProps>) =>
    select ? (
      <select aria-label={label} value={value} onChange={onChange}>
        <option value="bogus">Unknown order</option>
        {children}
      </select>
    ) : null,
  MenuItem: ({ value, children }: Readonly<{ value: string; children: ReactNode }>) => (
    <option value={value}>{children}</option>
  ),
}));

function renderToolbar() {
  const onSortChange = vi.fn();
  renderWithProviders(
    <ModuleToolbar
      search=""
      onSearchChange={vi.fn()}
      sort="default"
      onSortChange={onSortChange}
    />,
  );
  return { onSortChange, field: screen.getByRole('combobox', { name: 'Sort by' }) };
}

describe('ModuleToolbar sort', () => {
  it('hands a known order to the launcher', () => {
    const { onSortChange, field } = renderToolbar();

    fireEvent.change(field, { target: { value: 'name-desc' } });

    expect(onSortChange).toHaveBeenCalledTimes(1);
    expect(onSortChange).toHaveBeenCalledWith('name-desc');
  });

  it('ignores a value that is not one of its orders', () => {
    const { onSortChange, field } = renderToolbar();

    fireEvent.change(field, { target: { value: 'bogus' } });

    expect(onSortChange).not.toHaveBeenCalled();
  });
});
