/**
 * The conversation engine: given a chat's state and what the customer just did, what the bot
 * says next. Pure — no timers, no storage, no network. Time comes in as `ctx.now`; replies go
 * out stamped with when they should appear; reminders come back as pushes for the screen to
 * deliver; free text it cannot read itself comes back as an `ai` request for the server.
 */
import { HANDLE, waitsForCustomer } from '../handles';
import type {
  AiRequest,
  AiResult,
  BotContent,
  ChatMessage,
  ChatState,
  EngineResult,
  EngineSignal,
  OutgoingMessage,
  PendingPush,
  RenderedOption,
} from '../messages';
import type { WaNode, WorkflowDef } from '../schema';
import { createDummy, hashSeed, type DummyData } from './dummy';
import { DEFAULT_INPUT_ERRORS, parseInput } from './inputs';
import { menuMessage, MENU, matchKeywords, isMenuWord } from './menu';
import { renderNode } from './render';
import { evaluateAll, scopeOf, say } from './template';
import type { DemoBundle, EngineContext } from './types';

/** Longest run of nodes one event may play, so a loop in a graph cannot hang the chat. */
const MAX_STEPS = 40;
const FALLBACK_TEXT =
  "Sorry, I didn't catch that. Pick an option below, or type *menu* at any time.";
const MISSING_TEXT = 'That option is no longer available. Here is the menu again.';

export type ChatEvent =
  | { type: 'start' }
  | { type: 'choice'; option: RenderedOption; quoted: string }
  | { type: 'text'; text: string }
  | { type: 'push'; push: PendingPush }
  | { type: 'ai'; request: AiRequest; result: AiResult };

/** One event's worth of work: the state it changes and everything it produces. */
class Run {
  readonly replies: OutgoingMessage[] = [];
  readonly scheduled: PendingPush[] = [];
  readonly signals: EngineSignal[] = [];
  state: ChatState;
  cursor: number;
  extraTyping = 0;
  ai?: AiRequest;
  sent?: ChatMessage;

  constructor(
    readonly bundle: DemoBundle,
    state: ChatState,
    readonly ctx: EngineContext,
  ) {
    this.state = { ...state, vars: { ...state.vars } };
    this.cursor = ctx.now;
  }

  nextId(): string {
    this.state.seq += 1;
    return `${this.state.demoKey}-${this.state.seed.toString(36)}-${this.state.seq}`;
  }

  get data(): DummyData {
    return createDummy(this.state.seed + this.state.seq * 7919, this.ctx.now);
  }

  get scope() {
    return scopeOf(this.state.vars, this.ctx);
  }

  workflow(key: string | undefined): WorkflowDef | undefined {
    return this.bundle.workflows.find((w) => w.key === key);
  }

  emit(content: BotContent): void {
    const base = content.type === 'text' ? 400 + content.text.length * 14 : 1100;
    const typingMs = Math.round(
      (Math.min(2200, base) + this.extraTyping) * (this.ctx.typingScale ?? 1),
    );
    this.extraTyping = 0;
    this.cursor += typingMs;
    this.replies.push({
      message: { id: this.nextId(), from: 'bot', at: this.cursor, content },
      typingMs,
    });
  }

  userSays(content: ChatMessage['content']): void {
    this.sent = { id: this.nextId(), from: 'user', at: this.ctx.now, content, status: 'sent' };
  }

  result(): EngineResult {
    return {
      state: this.state,
      sent: this.sent,
      replies: this.replies,
      scheduled: this.scheduled,
      signals: this.signals,
      ai: this.ai,
    };
  }
}

function edgeTarget(workflow: WorkflowDef, node: string, handle: string): string | undefined {
  return workflow.graph.edges.find((e) => e.source === node && e.sourceHandle === handle)?.target;
}

function showMenu(run: Run, lead?: string): void {
  if (lead) {
    run.emit({ type: 'text', text: run.ctx.t(lead) });
  }
  run.emit(menuMessage(run.bundle, run.scope, run.ctx));
}

function abandonCurrent(run: Run): void {
  const { workflow, completed } = run.state;
  if (workflow && !completed) {
    run.signals.push({ type: 'FLOW_ABANDONED', workflow, node: run.state.awaiting?.node ?? '' });
  }
}

function beginWorkflow(run: Run, key: string): void {
  const workflow = run.workflow(key);
  if (!workflow) {
    showMenu(run, MISSING_TEXT);
    return;
  }
  abandonCurrent(run);
  run.state.workflow = key;
  run.state.completed = false;
  run.signals.push({ type: 'FLOW_STARTED', workflow: key, node: workflow.graph.start });
  play(run, workflow, workflow.graph.start);
}

function complete(run: Run, workflow: WorkflowDef, node: WaNode): void {
  if (run.state.workflow === workflow.key && !run.state.completed) {
    run.state.completed = true;
    run.signals.push({ type: 'FLOW_COMPLETED', workflow: workflow.key, node: node.id });
  }
}

function conditionHandle(node: Extract<WaNode, { type: 'condition' }>, run: Run): string {
  const scope = run.scope;
  const hit = node.data.cases.find((c) => {
    const actual = (scope[c.var] ?? '').trim().toLowerCase();
    const expected = (c.value ?? '').trim().toLowerCase();
    switch (c.op) {
      case 'eq':
        return actual === expected;
      case 'neq':
        return actual !== expected;
      case 'contains':
        return actual.includes(expected);
      case 'empty':
        return actual === '';
      case 'notEmpty':
        return actual !== '';
      case 'gt':
        return Number(actual) > Number(expected);
      default:
        return Number(actual) < Number(expected);
    }
  });
  return hit?.id ?? HANDLE.else;
}

/** What a logic node does, and which output it leaves by (undefined = stop here). */
function act(run: Run, workflow: WorkflowDef, node: WaNode): string | undefined {
  switch (node.type) {
    case 'condition':
      return conditionHandle(node, run);
    case 'delay':
      run.extraTyping += node.data.ms;
      return HANDLE.next;
    case 'reminder': {
      const target = edgeTarget(workflow, node.id, HANDLE.later);
      if (target) {
        run.scheduled.push({
          id: run.nextId(),
          demoKey: run.state.demoKey,
          workflow: workflow.key,
          node: target,
          at: run.cursor + node.data.afterMs,
          label: node.data.label,
        });
      }
      return HANDLE.next;
    }
    case 'jump':
      beginWorkflow(run, node.data.workflowKey);
      return undefined;
    case 'end':
      if (node.data.showMenu) {
        run.emit(menuMessage(run.bundle, run.scope, run.ctx));
      }
      return undefined;
    default:
      return waitsForCustomer(node) ? undefined : HANDLE.next;
  }
}

/** Plays from `start` until a node waits for the customer or the path ends. */
function play(run: Run, workflow: WorkflowDef, start: string): void {
  let current: string | undefined = start;
  for (let step = 0; current && step < MAX_STEPS; step += 1) {
    const id: string = current;
    const node = workflow.graph.nodes.find((n) => n.id === id);
    if (!node) {
      showMenu(run, MISSING_TEXT);
      return;
    }
    Object.assign(run.state.vars, evaluateAll(node.data.set, run.scope, run.ctx, run.data));
    for (const content of renderNode(node, {
      workflow: workflow.key,
      scope: run.scope,
      ctx: run.ctx,
      data: run.data,
    })) {
      run.emit(content);
    }
    if (node.data.complete || node.type === 'end') {
      complete(run, workflow, node);
    }
    if (node.type === 'input' || node.type === 'ai') {
      run.state.awaiting = { workflow: workflow.key, node: node.id };
      return;
    }
    const handle = act(run, workflow, node);
    current = handle ? edgeTarget(workflow, node.id, handle) : undefined;
  }
}

function onChoice(run: Run, option: RenderedOption, quoted: string): void {
  run.userSays({ type: 'reply', text: option.title, quoted });
  run.state.awaiting = undefined;
  Object.assign(run.state.vars, option.set ?? {});
  run.signals.push({
    type: 'STEP',
    workflow: option.ref.workflow,
    node: option.ref.node,
    stepKind: 'choice',
    label: option.title,
  });
  if (option.ref.workflow === MENU) {
    beginWorkflow(run, option.ref.handle);
    return;
  }
  const workflow = run.workflow(option.ref.workflow);
  const target = workflow ? edgeTarget(workflow, option.ref.node, option.ref.handle) : undefined;
  if (!workflow || !target) {
    showMenu(run, MISSING_TEXT);
    return;
  }
  if (workflow.key !== run.state.workflow) {
    abandonCurrent(run);
    run.state.workflow = workflow.key;
    run.state.completed = false;
    run.signals.push({ type: 'FLOW_STARTED', workflow: workflow.key, node: option.ref.node });
  }
  play(run, workflow, target);
}

function aiRequestFor(
  node: Extract<WaNode, { type: 'ai' }>,
  workflow: string,
  text: string,
): AiRequest {
  return {
    workflow,
    node: node.id,
    text,
    intents: node.data.intents,
    entities: node.data.entities,
  };
}

function routerRequest(run: Run, text: string): AiRequest {
  return {
    workflow: '$router',
    node: '$router',
    text,
    intents: run.bundle.workflows.map((w) => ({
      id: w.key,
      description: `${w.name}: ${w.description}`,
    })),
    entities: [],
  };
}

function onAwaitedText(run: Run, text: string): boolean {
  const awaiting = run.state.awaiting;
  const workflow = run.workflow(awaiting?.workflow);
  const node = workflow?.graph.nodes.find((n) => n.id === awaiting?.node);
  if (!workflow || !node) {
    return false;
  }
  if (node.type === 'ai') {
    run.ai = aiRequestFor(node, workflow.key, text);
    return true;
  }
  if (node.type !== 'input') {
    return false;
  }
  const value = parseInput(node.data.kind, text, { past: node.data.past, now: run.ctx.now });
  if (value === null) {
    run.emit({
      type: 'text',
      text: say(node.data.error ?? DEFAULT_INPUT_ERRORS[node.data.kind], run.scope, run.ctx),
    });
    return true;
  }
  run.state.vars[node.data.var] = value;
  run.state.awaiting = undefined;
  run.signals.push({
    type: 'STEP',
    workflow: workflow.key,
    node: node.id,
    stepKind: 'text',
    label: node.data.kind,
  });
  play(run, workflow, edgeTarget(workflow, node.id, HANDLE.next) ?? '');
  return true;
}

function onText(run: Run, text: string): void {
  run.userSays({ type: 'text', text });
  if (isMenuWord(text)) {
    abandonCurrent(run);
    run.state.awaiting = undefined;
    run.state.workflow = undefined;
    showMenu(run);
    return;
  }
  if (run.state.awaiting && onAwaitedText(run, text)) {
    return;
  }
  const key = matchKeywords(run.bundle, text);
  if (key) {
    beginWorkflow(run, key);
  } else if (run.ctx.ai) {
    run.ai = routerRequest(run, text);
  } else {
    showMenu(run, FALLBACK_TEXT);
  }
}

function onAi(run: Run, request: AiRequest, result: AiResult): void {
  if (request.workflow === '$router') {
    const key = result?.intent ?? undefined;
    if (key && run.workflow(key)) {
      beginWorkflow(run, key);
    } else {
      showMenu(run, FALLBACK_TEXT);
    }
    return;
  }
  const workflow = run.workflow(request.workflow);
  const node = workflow?.graph.nodes.find((n) => n.id === request.node);
  if (!workflow || node?.type !== 'ai') {
    showMenu(run, MISSING_TEXT);
    return;
  }
  Object.assign(run.state.vars, result?.entities ?? {});
  const handle =
    result?.intent && node.data.intents.some((i) => i.id === result.intent)
      ? result.intent
      : HANDLE.fallback;
  if (handle === HANDLE.fallback && node.data.retry) {
    run.emit({ type: 'text', text: say(node.data.retry, run.scope, run.ctx) });
  }
  run.state.awaiting = undefined;
  run.signals.push({
    type: 'STEP',
    workflow: workflow.key,
    node: node.id,
    stepKind: 'text',
    label: `ai:${handle}`,
  });
  play(run, workflow, edgeTarget(workflow, node.id, handle) ?? '');
}

function onPush(run: Run, push: PendingPush): void {
  const workflow = run.workflow(push.workflow);
  if (!workflow) {
    return;
  }
  run.signals.push({ type: 'REMINDER_DELIVERED', workflow: push.workflow, node: push.node });
  play(run, workflow, push.node);
}

/** A fresh chat's state. The seed keeps one viewer's dummy data stable across reloads. */
export function newChatState(demoKey: string, seedText: string): ChatState {
  return { demoKey, vars: {}, seq: 0, seed: hashSeed(`${demoKey}:${seedText}`) };
}

/** Plays one event against a chat. */
export function respond(
  bundle: DemoBundle,
  state: ChatState,
  event: ChatEvent,
  ctx: EngineContext,
): EngineResult {
  const run = new Run(bundle, state, ctx);
  switch (event.type) {
    case 'start':
      run.emit({ type: 'text', text: say(bundle.demo.greeting, run.scope, ctx) });
      showMenu(run);
      break;
    case 'choice':
      onChoice(run, event.option, event.quoted);
      break;
    case 'text':
      onText(run, event.text.trim());
      break;
    case 'push':
      onPush(run, event.push);
      break;
    default:
      onAi(run, event.request, event.result);
  }
  return run.result();
}
