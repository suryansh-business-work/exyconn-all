import { JOB_KEYS, clearJobRuns, readJobRuns, recordJobRun } from '../../../src/utils/jobHeartbeat';

beforeEach(() => {
  clearJobRuns();
});

describe('job heartbeat', () => {
  it('records when a loop ticked and what it did', () => {
    const before = Date.now();
    recordJobRun(JOB_KEYS.reminders, 'sent 3 reminders');
    const run = readJobRuns().get(JOB_KEYS.reminders);
    expect(run?.summary).toBe('sent 3 reminders');
    expect(run?.at.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('keeps only the latest run per loop', () => {
    recordJobRun(JOB_KEYS.aiQueue, 'first');
    recordJobRun(JOB_KEYS.aiQueue, 'second');
    expect(readJobRuns().get(JOB_KEYS.aiQueue)?.summary).toBe('second');
    expect(readJobRuns().size).toBe(1);
  });

  it('hands out a copy, so a reader cannot change the registry', () => {
    recordJobRun(JOB_KEYS.statusMonitor, 'ok');
    const copy = readJobRuns();
    copy.delete(JOB_KEYS.statusMonitor);
    expect(readJobRuns().has(JOB_KEYS.statusMonitor)).toBe(true);
  });

  it('clearJobRuns empties the registry', () => {
    recordJobRun(JOB_KEYS.inboundMail, 'imported 1');
    clearJobRuns();
    expect(readJobRuns().size).toBe(0);
  });

  it('names every loop by its own key', () => {
    for (const [name, key] of Object.entries(JOB_KEYS)) {
      expect(key).toBe(name);
    }
  });
});
