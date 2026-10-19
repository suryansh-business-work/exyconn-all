/** Monaco's real modules need a browser with workers; stand-ins record how they are wired. */
const wiring = vi.hoisted(() => ({ api: { editor: {} }, config: vi.fn() }));

const worker = (label: string) => ({
  default: class {
    readonly label = label;
  },
});

vi.mock('monaco-editor/editor/editor.api', () => wiring.api);
vi.mock('monaco-editor/features/register.all', () => ({}));
vi.mock('monaco-editor/languages/definitions/css/register', () => ({}));
vi.mock('monaco-editor/languages/definitions/html/register', () => ({}));
vi.mock('monaco-editor/languages/features/css/register', () => ({}));
vi.mock('monaco-editor/languages/features/html/register', () => ({}));
vi.mock('monaco-editor/languages/features/json/register', () => ({}));
vi.mock('@monaco-editor/react', () => ({ loader: { config: wiring.config } }));
vi.mock('monaco-editor/editor/editor.worker?worker', () => worker('editor'));
vi.mock('monaco-editor/language/json/json.worker?worker', () => worker('json'));
vi.mock('monaco-editor/language/css/css.worker?worker', () => worker('css'));
vi.mock('monaco-editor/language/html/html.worker?worker', () => worker('html'));

const setup = await import('../../src/monaco-setup');

type LabelledWorker = { label: string };
const workerFor = (label: string) =>
  globalThis.MonacoEnvironment?.getWorker?.('id', label) as unknown as LabelledWorker;

describe('monaco-setup', () => {
  it("serves Monaco from the app's bundle, not a CDN", () => {
    expect(wiring.config).toHaveBeenCalledWith({ monaco: wiring.api });
    expect(setup.monaco).toEqual(wiring.api);
  });

  it('runs each language service in its own worker', () => {
    expect(workerFor('json').label).toBe('json');
    expect(workerFor('css').label).toBe('css');
    expect(workerFor('html').label).toBe('html');
  });

  it('runs everything else in the plain editor worker', () => {
    expect(workerFor('typescript').label).toBe('editor');
    expect(workerFor('editorWorkerService').label).toBe('editor');
  });
});
