import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UseEntitySaveOptions } from '@exyconn/shell/components/form/useEntitySave';
import { renderWithProviders } from '../../../../test-utils';
import { OrganizationAdminForm } from '../../../../../../src/pages/organizations/forms/organization-admin';

/**
 * What the form asks the shared save hook to do. Appointing is create-only: there is no
 * administrator record to edit here, so the update half must never reach the server.
 */
const hooks = vi.hoisted(() => ({
  options: [] as unknown[],
  assign: vi.fn(),
}));

vi.mock('@exyconn/shell/components/form/useEntitySave', () => ({
  useEntitySave: (options: unknown) => {
    hooks.options.push(options);
    return { isEdit: false, onSubmit: vi.fn() };
  },
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAssignOrganizationAdminMutation: () => [hooks.assign],
}));

afterEach(() => {
  hooks.options = [];
  vi.resetAllMocks();
});

type AdminValues = { name: string; email: string };

describe('OrganizationAdminForm save contract', () => {
  it('only ever creates, and names the company in the confirmation', async () => {
    renderWithProviders(
      <OrganizationAdminForm
        organizationId="org-7"
        organizationName="Fjord AS"
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const options = hooks.options.at(-1) as UseEntitySaveOptions<AdminValues, never>;
    expect(options.initial).toBeNull();
    expect(options.label).toBe('Administrator for {organization}');
    expect(options.labelValues).toEqual({ organization: 'Fjord AS' });

    await expect(options.update(undefined as never, { name: 'x', email: 'y' })).resolves.toBe(
      undefined,
    );
    expect(hooks.assign).not.toHaveBeenCalled();
  });
});
