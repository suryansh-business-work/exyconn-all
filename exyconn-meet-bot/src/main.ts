import { createServer } from 'node:http';
import { claim } from './api';
import { config } from './config';
import { errorText, log } from './log';
import { runTrip } from './trip';

/** Which slots (display + sink pairs) are recording a call right now. */
const busy = new Set<number>();

const freeSlot = (): number | null => {
  for (let slot = 0; slot < config.concurrency; slot += 1) {
    if (!busy.has(slot)) {
      return slot;
    }
  }
  return null;
};

/** Takes as many due trips as there are free slots; each runs on its own. */
async function poll(): Promise<void> {
  let slot = freeSlot();
  while (slot !== null) {
    const trip = await claim();
    if (!trip) {
      return;
    }
    const taken = slot;
    busy.add(taken);
    log('info', 'Meeting bot trip claimed', { dispatchId: trip.dispatchId, slot: taken });
    runTrip(trip, taken)
      .catch((error: unknown) =>
        log('error', 'Meeting bot trip crashed', { err: errorText(error) }),
      )
      .finally(() => busy.delete(taken));
    slot = freeSlot();
  }
}

const tick = () => {
  poll().catch((error: unknown) =>
    log('warn', 'Meeting bot poll failed', { err: errorText(error) }),
  );
};

// The health check reports how many calls are being recorded.
createServer((req, res) => {
  const healthy = req.url === '/health';
  res.writeHead(healthy ? 200 : 404, { 'Content-Type': 'application/json' });
  res.end(
    healthy ? JSON.stringify({ ok: true, inCalls: busy.size, slots: config.concurrency }) : '{}',
  );
}).listen(config.port, () => log('info', 'Meeting bot started', { port: config.port }));

if (config.botToken) {
  tick();
  globalThis.setInterval(tick, config.pollMs);
} else {
  log('warn', 'MEET_BOT_TOKEN is not set: the meeting bot stays idle');
}
