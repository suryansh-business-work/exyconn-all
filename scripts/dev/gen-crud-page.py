"""Generates an HR/Finance admin module (grid + 4-file form + CrudDashboard page) from a spec.
Usage: python3 scripts/dev/gen-crud-page.py <spec.json>   (kept in-repo so it cannot vanish with the scratchpad)"""
import json, pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parents[2]
SPECS = json.loads(pathlib.Path(sys.argv[1]).read_text())
def kebab(n): return re.sub(r'(?<!^)(?=[A-Z])', '-', n).lower()
def zod(field, label, kind, enum, optional):
    if kind == 'emp': return "z.string().min(1, 'Employee is required')"
    if kind in ('text','area'): return "z.string().trim()" if optional else f"z.string().trim().min(1, '{label} is required')"
    if kind == 'num': return "z.union([z.literal(''), z.coerce.number().min(0, 'Must be ≥ 0')])" if optional else f"z.coerce.number({{ message: '{label} must be a number' }}).min(0, 'Must be ≥ 0')"
    if kind == 'date': return "z.string()" if optional else f"z.string().min(1, '{label} is required')"
    if kind == 'enum': return f"z.nativeEnum({enum})"
    if kind == 'bool': return "z.boolean()"
    raise ValueError(kind)
def initial(f, kind, enum, optional):
    if kind == 'enum': return f"row?.{f} ?? Object.values({enum})[0]"
    if kind == 'bool': return f"row?.{f} ?? true"
    if kind == 'num' and not optional: return f"row?.{f} ?? 0"
    return f"row?.{f} ?? ''"
def rhf(f, label, kind, enum):
    if kind == 'emp': return f'      <RhfAutocomplete name="{f}" label="{label}" options={{employeeOptions}} />'
    if kind == 'enum': return f'      <RhfSelect name="{f}" label="{label}" options={{enumOptions(Object.values({enum}))}} />'
    if kind == 'area': return f'      <RhfTextField name="{f}" label="{label}" multiline minRows={{3}} />'
    if kind == 'num': return f'      <RhfTextField name="{f}" label="{label}" type="number" />'
    if kind == 'date': return f'      <RhfDatePicker name="{f}" label="{label}" />'
    if kind == 'bool': return f'      <RhfSwitch name="{f}" label="{label}" />'
    return f'      <RhfTextField name="{f}" label="{label}" />'
def column(f, label, kind):
    if kind == 'status': return f"  statusColumn('{f}', '{label}'),"
    if kind == 'date': return f"  dateColumn('{f}', '{label}'),"
    if kind == 'bool': return f"  boolColumn('{f}', '{label}'),"
    if kind == 'num': return f"  valueColumn('{f}', '{label}', (row) => String(row.{f} ?? '—')),"
    return f"  textColumn('{f}', '{label}'),"
for s in SPECS:
    E, P = s['entity'], s['plural']; base = ROOT / f"exyconn-portal/apps/{s['app']}/src/pages/{s['dir']}"
    fname = kebab(E); fdir = base / 'forms' / fname; fdir.mkdir(parents=True, exist_ok=True)
    enums = sorted({f[3] for f in s['fields'] if f[2]=='enum'}); nullable = set(s.get('nullable', []))
    rowtype = f"List{P}PagedQuery['list{P}Paged']['rows'][number]"
    kinds = {f[2] for f in s['fields']}
    rhf_imports = sorted({'RhfTextField'} | ({'RhfAutocomplete'} if 'emp' in kinds else set()) | ({'RhfSelect'} if 'enum' in kinds else set()) | ({'RhfDatePicker'} if 'date' in kinds else set()) | ({'RhfSwitch'} if 'bool' in kinds else set()))
    (fdir / f'{fname}.types.tsx').write_text(f"""import type {{ List{P}PagedQuery{''.join(', '+e for e in enums)} }} from '@exyconn/shell/graphql/generated';

export type {E}Row = {rowtype};

export interface {E}FormValues {{
{''.join(f"  {f[0]}: {'boolean' if f[2]=='bool' else ('number' if f[2]=='num' and not f[4] else (f[3] if f[2]=='enum' else 'string'))};" + chr(10) for f in s['fields'])}}}
""")
    nulls = ''.join(f"  {f}: values.{f} === '' ? null : values.{f},\n" for f in nullable)
    to_input = (f"/** Only inputs the SDL declares nullable become null; the rest are non-null. */\nconst toInput = (values: Values) => ({{\n  ...values,\n{nulls}}});\n" if nullable else "const toInput = (values: Values) => values;\n")
    emp_block = ("  const { data } = useListUsersQuery();\n\n  const employeeOptions = (data?.listUsers ?? []).map((user) => ({\n    value: user.id,\n    label: `${user.name} (${user.email})`,\n  }));\n\n" if 'emp' in kinds else "")
    (fdir / f'{fname}.form.tsx').write_text(f"""import {{ useForm }} from 'react-hook-form';
import {{ zodResolver }} from '@hookform/resolvers/zod';
import {{ z }} from 'zod';
import {{ {', '.join(rhf_imports)} }} from '@exyconn/shell/components/form/rhf';
import {{ EntityForm }} from '@exyconn/shell/components/form/EntityForm';
import {{ useEntitySave }} from '@exyconn/shell/components/form/useEntitySave';
{"import { enumOptions } from '@exyconn/shell/utils/enumOptions';" if 'enum' in kinds else ''}
import {{
{''.join(f'  {e},'+chr(10) for e in enums)}{'  useListUsersQuery,'+chr(10) if 'emp' in kinds else ''}  useCreate{E}Mutation,
  useUpdate{E}Mutation,
}} from '@exyconn/shell/graphql/generated';
import type {{ {E}Row }} from './{fname}.types';

const schema = z.object({{
{''.join(f"  {f[0]}: {zod(*f)}," + chr(10) for f in s['fields'])}}});
type Values = z.infer<typeof schema>;

const toInitial = (row: {E}Row | null) => ({{
{''.join(f"  {f[0]}: {initial(f[0], f[2], f[3], f[4])}," + chr(10) for f in s['fields'])}}});

{to_input}
interface {E}FormProps {{
  initial: {E}Row | null;
  onDone: () => void;
  onCancel: () => void;
}}

/** React Hook Form + Zod form to create or update {'an' if E[0] in 'AEIOU' else 'a'} {s['label']}. */
export function {E}Form({{ initial, onDone, onCancel }}: Readonly<{E}FormProps>) {{
  const [create{E}] = useCreate{E}Mutation();
  const [update{E}] = useUpdate{E}Mutation();
{emp_block}  const methods = useForm<z.input<typeof schema>, unknown, Values>({{
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  }});

  const {{ isEdit, onSubmit }} = useEntitySave({{
    label: '{E}',
    initial,
    create: (values: Values) => create{E}({{ variables: {{ input: toInput(values) }} }}),
    update: (row, values) => update{E}({{ variables: {{ id: row.id, input: toInput(values) }} }}),
    onDone,
  }});

  return (
    <EntityForm methods={{methods}} onSubmit={{onSubmit}} isEdit={{isEdit}} onCancel={{onCancel}}>
{chr(10).join(rhf(f[0], f[1], f[2], f[3]) for f in s['fields'])}
    </EntityForm>
  );
}}
""")
    (fdir / 'index.tsx').write_text(f"export {{ {E}Form }} from './{fname}.form';\nexport type {{ {E}FormValues, {E}Row }} from './{fname}.types';\n")
    req = [f for f in s['fields'] if f[2] in ('text','area') and not f[4]][:2]
    (fdir / f'{fname}.form.cy.tsx').write_text(f"""import {{ MockedProvider }} from '@apollo/client/testing';
import {{ LocalizationProvider, AdapterDateFns }} from '@exyconn/shell/components/ui';
import {{ ThemeProvider }} from '@exyconn/shell/components/ui/styles';
import {{ NotificationProvider }} from '@exyconn/shell/components/feedback/NotificationProvider';
import {{ theme }} from '@exyconn/shell/config/theme';
import {{ {E}Form }} from './{fname}.form';

const mount = () =>
  cy.mount(
    <MockedProvider mocks={{[]}} addTypename={{false}}>
      <ThemeProvider theme={{theme}}>
        <LocalizationProvider dateAdapter={{AdapterDateFns}}>
          <NotificationProvider>
            <{E}Form initial={{null}} onDone={{cy.stub()}} onCancel={{cy.stub().as('cancel')}} />
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('{E}Form', () => {{
  it('validates the required fields', () => {{
    mount();
    cy.contains('button', 'Create').click();
{chr(10).join(f"    cy.contains('{f[1]} is required').should('be.visible');" for f in ([f for f in s['fields'] if f[2]=='emp'][:1] + req))}
  }});

  it('calls onCancel', () => {{
    mount();
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  }});
}});
""")
    used = {c[2] for c in s['cols']}
    imps = sorted({'actionsColumn'} | {{'text':'textColumn','status':'statusColumn','date':'dateColumn','num':'valueColumn','bool':'boolColumn'}[k] for k in used})
    (base / f'{fname}-grid.tsx').write_text(f"""import type {{ ColDef }} from 'ag-grid-community';
import {{ {', '.join(imps)}, type DatedCrudGridContext }} from '@exyconn/crud';
import type {{ List{P}PagedQuery }} from '@exyconn/shell/graphql/generated';

export type Paged{E}Row = {rowtype};

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type {E}GridContext = DatedCrudGridContext<Paged{E}Row>;

/** Column model for the server-side {s['title']} grid. */
export const {kebab(E).upper().replace('-','_')}_COLUMNS: ColDef<Paged{E}Row>[] = [
{chr(10).join(column(*c) for c in s['cols'])}
  actionsColumn(),
];
""")
    page = ''.join(w.capitalize() for w in s['dir'].split('-')) + 'Page'
    stat_lines = []
    for label, field, value in s['stats']:
        if field == 'total': stat_lines.append(f"    {{ label: '{label}', value: String(statTotal(stats)), accent: '{s['accent']}' }},")
        elif field == 'sum': stat_lines.append(f"    {{ label: '{label}', value: statSum(stats, '{value}').toLocaleString(), accent: '{s['accent']}' }},")
        else: stat_lines.append(f"    {{ label: '{label}', value: String(statCount(stats, '{field}', '{value}')), accent: '{s['accent']}' }},")
    helpers = sorted({'statTotal'} | ({'statCount'} if any(f not in ('total','sum') for _,f,_ in s['stats']) else set()) | ({'statSum'} if any(f=='sum' for _,f,_ in s['stats']) else set()))
    (base / f'{page}.tsx').write_text(f"""import {{ CrudDashboard, useCrudResource, usePagedFetcher }} from '@exyconn/crud';
import type {{ StatItem }} from '@exyconn/shell/components/dashboard/StatCard';
import {{ {', '.join(helpers)} }} from '@exyconn/shell/components/data/tableStats';
import {{ useSettings }} from '@exyconn/shell/hooks/useSettings';
import {{
  useList{P}StatsQuery,
  useDelete{E}Mutation,
  List{P}PagedDocument,
  type List{P}PagedQuery,
}} from '@exyconn/shell/graphql/generated';
import {{ {E}Form, type {E}Row }} from './forms/{fname}';
import {{ {kebab(E).upper().replace('-','_')}_COLUMNS, type Paged{E}Row, type {E}GridContext }} from './{fname}-grid';

/** {s['title']} — server-paged admin grid over the {s['label']} records. */
export function {page}() {{
  const {{ data: statsData, refetch: refetchStats }} = useList{P}StatsQuery();
  const [delete{E}] = useDelete{E}Mutation();
  const {{ formatDate }} = useSettings();

  const crud = useCrudResource<{E}Row, Paged{E}Row>({{
    label: '{E}',
    onDelete: (row) => delete{E}({{ variables: {{ id: row.id }} }}),
    confirmMessage: () => 'Delete this {s['label']}?',
    refetch: refetchStats,
  }});
  const fetchRows = usePagedFetcher(List{P}PagedDocument, (data: List{P}PagedQuery) => data.list{P}Paged);

  const stats = statsData?.list{P}Stats;
  const statItems: StatItem[] = [
{chr(10).join(stat_lines)}
  ];

  const gridContext: {E}GridContext = {{ actions: {{ edit: crud.openEdit, delete: crud.remove }}, formatDate }};

  return (
    <CrudDashboard
      title="{s['title']}"
      subtitle="{s['subtitle']}"
      entityLabel="{s['label']}"
      stats={{statItems}}
      crud={{crud}}
      renderForm={{(initial) => <{E}Form initial={{initial}} onCancel={{crud.close}} onDone={{crud.onDone}} />}}
      columnDefs={{{kebab(E).upper().replace('-','_')}_COLUMNS}}
      fetchRows={{fetchRows}}
      context={{gridContext}}
      searchPlaceholder="{s['search']}"
    />
  );
}}
""")
    (base / 'index.ts').write_text(f"export {{ {page} }} from './{page}';\n")
    print(f"  {s['app']}/{s['dir']} -> {page}")
