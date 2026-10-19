import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { LeadImportStatus } from '@exyconn/shell/graphql/generated';
import { CHUNK } from '../../../../src/pages/lead-generator/leadImportInput';
import { useLeadImport } from '../../../../src/pages/lead-generator/useLeadImport';
import { renderHookWithProviders } from '../../test-utils';
import { foundLookup, importResult, leadPlace, preview } from './lead-fixtures';

const gql = vi.hoisted(() => ({
  previewLeads: vi.fn(),
  importLeads: vi.fn(),
  previewing: false,
  importing: false,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePreviewLeadImportLazyQuery: () => [gql.previewLeads, { loading: gql.previewing }],
  useImportLeadsToCrmMutation: () => [gql.importLeads, { loading: gql.importing }],
}));

const a = leadPlace({ placeId: 'a', name: 'A' });
const b = leadPlace({ placeId: 'b', name: 'B' });
const lookups = { a: foundLookup(['hi@a.example']) };

const previewAnswer = (...rows: ReturnType<typeof preview>[]) => ({
  data: { previewLeadImport: rows },
});
const importAnswer = (overrides: Parameters<typeof importResult>[0]) => ({
  data: { importLeadsToCrm: importResult(overrides) },
});

function setup() {
  const onFiled = vi.fn();
  const hook = renderHookWithProviders(() => useLeadImport(onFiled));
  return { onFiled, result: hook.result };
}

describe('useLeadImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.previewing = false;
    gql.importing = false;
  });

  it('files every place straight away when none is in the CRM yet', async () => {
    gql.previewLeads.mockResolvedValue(
      previewAnswer(preview({ placeId: 'a' }), preview({ placeId: 'b' })),
    );
    gql.importLeads.mockResolvedValue(
      importAnswer({
        created: 2,
        filed: [
          { placeId: 'a', companyId: 'c-a' },
          { placeId: 'b', companyId: 'c-b' },
        ],
      }),
    );
    const { onFiled, result } = setup();

    await act(() => result.current.run([a, b], lookups));

    const sent = gql.importLeads.mock.calls[0][0].variables;
    expect(sent.mergeInto).toEqual([]);
    expect(sent.leads.map((lead: { emails: string[] }) => lead.emails)).toEqual([
      ['hi@a.example'],
      [],
    ]);
    expect(onFiled).toHaveBeenCalledWith([
      { placeId: 'a', companyId: 'c-a' },
      { placeId: 'b', companyId: 'c-b' },
    ]);
    expect(result.current.summary?.created).toBe(2);
    expect(result.current.review).toBeNull();
    expect(result.current.error).toBeNull();

    act(() => result.current.dismiss());
    expect(result.current.summary).toBeNull();
  });

  it('previews and files in server-sized batches, adding the results up', async () => {
    const many = Array.from({ length: CHUNK + 1 }, (_, i) => leadPlace({ placeId: `p${i}` }));
    gql.previewLeads.mockImplementation(
      ({ variables }: { variables: { leads: { placeId: string }[] } }) =>
        Promise.resolve(
          previewAnswer(...variables.leads.map((lead) => preview({ placeId: lead.placeId }))),
        ),
    );
    gql.importLeads
      .mockResolvedValueOnce(importAnswer({ created: CHUNK }))
      .mockResolvedValueOnce(importAnswer({ created: 1 }));
    const { result } = setup();

    await act(() => result.current.run(many, {}));

    expect(gql.previewLeads).toHaveBeenCalledTimes(2);
    expect(gql.importLeads).toHaveBeenCalledTimes(2);
    expect(result.current.summary?.created).toBe(CHUNK + 1);
  });

  it('asks for a review when some places are already companies, then files the chosen updates', async () => {
    const duplicate = preview({
      placeId: 'b',
      status: LeadImportStatus.DuplicateWithExtra,
      existingCompanyId: 'c-b',
    });
    gql.previewLeads.mockResolvedValue(previewAnswer(preview({ placeId: 'a' }), duplicate));
    gql.importLeads.mockResolvedValue(
      importAnswer({
        created: 1,
        merged: 1,
        filed: [{ placeId: 'a', companyId: 'c-a' }],
        merges: [{ placeId: 'b', companyId: 'c-b', name: 'B', added: [] }],
      }),
    );
    const { onFiled, result } = setup();

    await act(() => result.current.run([a, b], lookups));

    expect(gql.importLeads).not.toHaveBeenCalled();
    expect(result.current.review?.previews).toEqual([preview({ placeId: 'a' }), duplicate]);

    await act(() => result.current.confirm(new Set(['b'])));

    expect(result.current.review).toBeNull();
    expect(gql.importLeads.mock.calls[0][0].variables.mergeInto).toEqual([
      { placeId: 'b', companyId: 'c-b' },
    ]);
    expect(onFiled).toHaveBeenCalledWith([
      { placeId: 'a', companyId: 'c-a' },
      { placeId: 'b', companyId: 'c-b' },
    ]);
  });

  it('drops the review on cancel, and confirming without a review does nothing', async () => {
    gql.previewLeads.mockResolvedValue(
      previewAnswer(preview({ placeId: 'a', status: LeadImportStatus.Duplicate })),
    );
    const { onFiled, result } = setup();

    await act(() => result.current.run([a], {}));
    act(() => result.current.cancel());
    expect(result.current.review).toBeNull();

    await act(() => result.current.confirm(new Set()));
    expect(gql.importLeads).not.toHaveBeenCalled();
    expect(onFiled).not.toHaveBeenCalled();
  });

  it('shows no summary when nothing was created, updated or skipped', async () => {
    gql.previewLeads.mockResolvedValue(previewAnswer(preview({ placeId: 'a' })));
    gql.importLeads.mockResolvedValue(importAnswer({}));
    const { onFiled, result } = setup();

    await act(() => result.current.run([a], {}));

    expect(onFiled).toHaveBeenCalledWith([]);
    expect(result.current.summary).toBeNull();
  });

  it('reports a failed preview and files nothing', async () => {
    gql.previewLeads
      .mockResolvedValueOnce({ data: undefined, error: new Error('Places quota used up') })
      .mockResolvedValueOnce({ data: undefined })
      .mockRejectedValueOnce('offline');
    const { onFiled, result } = setup();

    await act(() => result.current.run([a], {}));
    expect(result.current.error).toBe('Places quota used up');

    await act(() => result.current.run([a], {}));
    expect(result.current.error).toBe('No import preview came back');

    await act(() => result.current.run([a], {}));
    expect(result.current.error).toBe('Could not check the leads against the CRM');
    expect(gql.importLeads).not.toHaveBeenCalled();
    expect(onFiled).not.toHaveBeenCalled();
  });

  it('reports a failed import but still marks and sums the batches that went through', async () => {
    const many = Array.from({ length: CHUNK + 1 }, (_, i) => leadPlace({ placeId: `p${i}` }));
    gql.previewLeads.mockImplementation(() => Promise.resolve(previewAnswer()));
    gql.importLeads
      .mockResolvedValueOnce(
        importAnswer({ created: 1, filed: [{ placeId: 'p0', companyId: 'c0' }] }),
      )
      .mockRejectedValueOnce(new Error('Server busy'));
    const { onFiled, result } = setup();

    await act(() => result.current.run(many, {}));

    expect(result.current.error).toBe('Server busy');
    expect(onFiled).toHaveBeenCalledWith([{ placeId: 'p0', companyId: 'c0' }]);
    expect(result.current.summary?.created).toBe(1);
  });

  it('falls back to a generic message when the import fails without one', async () => {
    gql.previewLeads.mockResolvedValue(previewAnswer());
    gql.importLeads.mockRejectedValue('offline');
    const { result } = setup();

    await act(() => result.current.run([a], {}));

    expect(result.current.error).toBe('Could not add the leads to the CRM');
  });

  it('is loading while either the preview or the import runs', () => {
    gql.previewing = true;
    expect(setup().result.current.loading).toBe(true);

    gql.previewing = false;
    gql.importing = true;
    expect(setup().result.current.loading).toBe(true);

    gql.importing = false;
    expect(setup().result.current.loading).toBe(false);
  });
});
