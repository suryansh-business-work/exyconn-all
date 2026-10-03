// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import ProjectPicker from './ProjectPicker';
import TicketPicker from './TicketPicker';
import { trackerState } from '../a11y/tracker-fixture';
import { cleanup, installDomShims, mount } from '../a11y/render-harness';
import { choose, finish, overrideTracker } from '../a11y/component-harness';

beforeAll(installDomShims);
afterEach(cleanup);

const state = trackerState('idle');

function spinners(): number {
  return document.querySelectorAll('.MuiCircularProgress-root').length;
}

function combobox(): HTMLElement {
  return document.querySelector<HTMLElement>('[role="combobox"]')!;
}

describe('ProjectPicker', () => {
  it('shows a spinner in place of the arrow until the portal has sent the projects', async () => {
    await mount(
      <ProjectPicker projects={[]} selectedProjectId="" disabled={false} loading />,
      state,
    );
    expect(spinners()).toBe(1);
    expect(document.body.textContent).toContain('Loading projects…');
    expect(combobox().getAttribute('aria-disabled')).toBe('true');
  });

  it('books the next session to the project picked, and says when it is locked', async () => {
    await mount(
      <ProjectPicker
        projects={[...state.projects, { id: 'p2', name: 'Website', key: 'WEB' }]}
        selectedProjectId="p1"
        disabled={false}
        loading={false}
      />,
      state,
    );
    expect(spinners()).toBe(0);
    const picked: string[] = [];
    overrideTracker({ setProject: (id: never) => Promise.resolve(picked.push(id)) });
    await choose('Project', 'Website');
    await finish(() => undefined);
    expect(picked).toEqual(['p2']);
  });

  it('explains the lock while tracking', async () => {
    await mount(
      <ProjectPicker projects={state.projects} selectedProjectId="p1" disabled loading={false} />,
      state,
    );
    expect(document.body.textContent).toContain('Locked while tracking');
  });
});

describe('TicketPicker', () => {
  it('shows a spinner while the selected project’s tickets load', async () => {
    await mount(<TicketPicker tasks={[]} selectedTaskId="" disabled={false} loading />, state);
    expect(spinners()).toBe(1);
    expect(document.body.textContent).toContain('Loading tickets…');
  });

  it('picks a ticket once they are in, and explains the lock while tracking', async () => {
    await mount(
      <TicketPicker
        tasks={[...state.tasks, { id: 't2', key: 'EXY-2', title: 'Docs', assignedToMe: false }]}
        selectedTaskId=""
        disabled={false}
        loading={false}
      />,
      state,
    );
    expect(document.body.textContent).toContain('Optional.');
    const picked: string[] = [];
    overrideTracker({ setTask: (id: never) => Promise.resolve(picked.push(id)) });
    await choose('Ticket', 'EXY-1 · Onboarding');
    await finish(() => undefined);
    expect(picked).toEqual(['t1']);
    cleanup();

    await mount(
      <TicketPicker tasks={state.tasks} selectedTaskId="" disabled loading={false} />,
      state,
    );
    expect(document.body.textContent).toContain('Locked while tracking');
  });
});
