import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CrmObject } from '@exyconn/shell/graphql/generated';
import { CustomPropertiesGate } from '../../../../src/records/custom-fields';
import { renderWithProviders } from '../../test-utils';
import { objectSchema, property } from '../records-fixtures';

const mocked = vi.hoisted(() => ({ schema: vi.fn(), logError: vi.fn() }));

vi.mock('../../../../src/records/schema', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/records/schema')>()),
  useObjectSchema: (object: unknown) => mocked.schema(object),
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { error: (...args: unknown[]) => mocked.logError(...args) },
}));

const NAME = property();
const TIER = property({ key: 'tier', label: 'Tier', builtIn: false });

function renderGate() {
  const children = vi.fn((custom: unknown[]) => <p>Form with {custom.length} custom</p>);
  renderWithProviders(<CustomPropertiesGate object={CrmObject.Lead}>{children}</CustomPropertiesGate>);
  return children;
}

describe('CustomPropertiesGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with only the custom properties', () => {
    mocked.schema.mockReturnValue(objectSchema([NAME, TIER]));
    const children = renderGate();
    expect(screen.getByText('Form with 1 custom')).toBeInTheDocument();
    expect(children).toHaveBeenLastCalledWith([TIER]);
    expect(mocked.schema).toHaveBeenCalledWith(CrmObject.Lead);
    expect(mocked.logError).not.toHaveBeenCalled();
  });

  it('holds the form back with a skeleton while the properties load', () => {
    mocked.schema.mockReturnValue({ ...objectSchema([]), loading: true });
    const children = renderGate();
    expect(screen.getByRole('status')).toHaveTextContent('Loading the form');
    expect(children).not.toHaveBeenCalled();
  });

  it('shows and logs a failure when nothing could be loaded', () => {
    const error = new Error('Schema offline');
    mocked.schema.mockReturnValue({ ...objectSchema([]), error });
    const children = renderGate();
    expect(screen.getByRole('alert')).toHaveTextContent('Schema offline');
    expect(children).not.toHaveBeenCalled();
    expect(mocked.logError).toHaveBeenCalledWith(
      'Could not load the CRM properties for a record form',
      error,
      { object: CrmObject.Lead },
    );
  });

  it('keeps the form on cached properties when a refresh fails or is running', () => {
    mocked.schema.mockReturnValue({ ...objectSchema([TIER]), error: new Error('x'), loading: true });
    renderGate();
    expect(screen.getByText('Form with 1 custom')).toBeInTheDocument();
    expect(mocked.logError).toHaveBeenCalledTimes(1);
  });

  it('renders the form when the record type has no properties at all', () => {
    mocked.schema.mockReturnValue(objectSchema([]));
    renderGate();
    expect(screen.getByText('Form with 0 custom')).toBeInTheDocument();
  });
});
