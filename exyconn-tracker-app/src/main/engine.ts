import { powerMonitor } from 'electron';
import type { LiveStats, TrackerSettings, TrackerStatus } from '@shared/types';
import { InputCounter } from './trackers/input-counter';
import { WindowTracker } from './trackers/window-tracker';
import { Screenshotter } from './trackers/screenshotter';
import { Outbox, type OutboxItem } from './outbox';
import * as portal from './portal-client';
import { TrackerAuthError } from './portal-client';

const TICK_MS = 1000;

/** Callbacks the engine uses to talk back to the app shell (tray/renderer/sign-out). */
export interface EngineHooks {
  onStats: (stats: LiveStats) => void;
  onAuthError: () => void;
}

/**
 * The tracking loop. Once per second it samples idle state and the foreground window and
 * accumulates activity; once per configured interval it flushes an activity bucket and
 * (probabilistically) captures screenshots. Everything is queued through the durable
 * Outbox first, so nothing is lost if the portal is briefly unreachable.
 */
export class TrackerEngine {
  private readonly input = new InputCounter();
  private readonly windows = new WindowTracker();
  private readonly screenshotter = new Screenshotter();
  private readonly outbox = new Outbox();

  private status: TrackerStatus = 'idle';
  private settings: TrackerSettings;
  private sessionId: string | null = null;
  private timer: NodeJS.Timeout | null = null;

  private intervalStartedAt = 0;
  private intervalActiveMs = 0;
  private intervalIdleMs = 0;
  private nextScreenshotAt: number | null = null;
  private currentApp = '';
  private sessionActiveMs = 0;
  private sessionIdleMs = 0;
  private sessionKeys = 0;
  private sessionMouse = 0;
  private screenshotCount = 0;
  private lastSyncAt: string | null = null;

  constructor(
    settings: TrackerSettings,
    private readonly hooks: EngineHooks,
  ) {
    this.settings = settings;
  }

  get currentStatus(): TrackerStatus {
    return this.status;
  }

  updateSettings(settings: TrackerSettings): void {
    this.settings = settings;
  }

  async start(): Promise<void> {
    if (this.status === 'tracking') {
      return;
    }
    this.sessionId = await portal.startSession(new Date().toISOString());
    this.input.start();
    this.beginInterval(Date.now());
    this.status = 'tracking';
    this.timer = setInterval(() => {
      this.tick().catch((error) => this.handleError(error));
    }, TICK_MS);
    this.emit();
  }

  pause(): void {
    if (this.status !== 'tracking') {
      return;
    }
    this.input.stop();
    this.status = 'paused';
    this.emit();
  }

  resume(): void {
    if (this.status !== 'paused') {
      return;
    }
    this.input.start();
    this.status = 'tracking';
    this.emit();
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.input.stop();
    if (this.sessionId) {
      await this.flushInterval(Date.now());
      await portal.stopSession(this.sessionId, new Date().toISOString()).catch(() => undefined);
    }
    this.sessionId = null;
    this.status = 'idle';
    this.resetSessionTotals();
    this.emit();
  }

  private beginInterval(now: number): void {
    this.intervalStartedAt = now;
    this.intervalActiveMs = 0;
    this.intervalIdleMs = 0;
    this.scheduleScreenshot(now);
  }

  /** Picks when in this interval a screenshot fires (random or at the start). */
  private scheduleScreenshot(now: number): void {
    if (this.settings.screenshotsPerInterval <= 0) {
      this.nextScreenshotAt = null;
      return;
    }
    const windowMs = this.settings.intervalMinutes * 60_000;
    if (this.settings.randomizeScreenshotTiming) {
      // Not crypto: this only decides screenshot timing, and jitter is the whole point.
      this.nextScreenshotAt = now + Math.floor(Math.random() * windowMs);
    } else {
      this.nextScreenshotAt = now + 1000;
    }
  }

  private async tick(): Promise<void> {
    if (this.status !== 'tracking') {
      return;
    }
    const now = Date.now();

    const idleFor = powerMonitor.getSystemIdleTime();
    const isIdle = idleFor >= this.settings.idleThresholdSeconds;
    if (isIdle) {
      this.intervalIdleMs += TICK_MS;
      this.sessionIdleMs += TICK_MS;
    } else {
      this.intervalActiveMs += TICK_MS;
      this.sessionActiveMs += TICK_MS;
    }

    this.currentApp = await this.windows.sample(now);

    if (this.nextScreenshotAt !== null && now >= this.nextScreenshotAt) {
      this.nextScreenshotAt = null;
      await this.takeScreenshots(now);
    }

    if (now - this.intervalStartedAt >= this.settings.intervalMinutes * 60_000) {
      await this.flushInterval(now);
      this.beginInterval(now);
    }

    await this.flushOutbox();
    this.emit();
  }

  private async takeScreenshots(now: number): Promise<void> {
    const captures = await this.screenshotter.capture(this.settings);
    for (const capture of captures) {
      this.outbox.enqueueScreenshot({
        sessionId: this.sessionId ?? '',
        intervalStartedAt: new Date(this.intervalStartedAt).toISOString(),
        capturedAt: new Date(now).toISOString(),
        image: capture.image,
        displayId: capture.displayId,
        blurred: capture.blurred,
      });
      this.screenshotCount += 1;
    }
  }

  private async flushInterval(now: number): Promise<void> {
    if (!this.sessionId || this.intervalActiveMs + this.intervalIdleMs === 0) {
      return;
    }
    const counts = this.input.drain();
    this.sessionKeys += counts.keys;
    this.sessionMouse += counts.clicks;

    this.outbox.enqueueInterval(this.sessionId, {
      startedAt: new Date(this.intervalStartedAt).toISOString(),
      endedAt: new Date(now).toISOString(),
      keyCount: counts.keys,
      mouseCount: counts.clicks,
      activeMs: this.intervalActiveMs,
      idleMs: this.intervalIdleMs,
      windows: this.windows.drain(now, this.settings.trackWindowTitles),
    });
  }

  private async flushOutbox(): Promise<void> {
    const sent = await this.outbox.flush((item) => this.send(item));
    if (sent > 0) {
      this.lastSyncAt = new Date().toISOString();
    }
  }

  private send(item: OutboxItem): Promise<void> {
    if (item.kind === 'interval') {
      return portal.syncIntervals(item.sessionId, [item.payload]).then(() => undefined);
    }
    return portal.uploadScreenshot(item.payload).then(() => undefined);
  }

  private handleError(error: unknown): void {
    if (error instanceof TrackerAuthError) {
      // Device or access revoked mid-session — stop and let the shell sign out.
      void this.stop();
      this.hooks.onAuthError();
    }
  }

  private resetSessionTotals(): void {
    this.sessionActiveMs = 0;
    this.sessionIdleMs = 0;
    this.sessionKeys = 0;
    this.sessionMouse = 0;
    this.screenshotCount = 0;
  }

  stats(): LiveStats {
    const live = this.input.peek();
    return {
      status: this.status,
      sessionActiveMs: this.sessionActiveMs,
      sessionIdleMs: this.sessionIdleMs,
      keyCount: this.sessionKeys + live.keys,
      mouseCount: this.sessionMouse + live.clicks,
      currentApp: this.currentApp,
      screenshotCount: this.screenshotCount,
      pendingSync: this.outbox.size,
      lastSyncAt: this.lastSyncAt,
    };
  }

  private emit(): void {
    this.hooks.onStats(this.stats());
  }
}
