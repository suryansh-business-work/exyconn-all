import { chromium, type BrowserContext, type Page } from 'playwright-core';
import { config } from './config';
import { SCREEN, type Stage } from './display';
import { errorText, log } from './log';

/** Where the bot is in Google Meet. Read from the visible, English UI (the browser is en-US). */
export type CallState = 'LOBBY' | 'WAITING' | 'IN_CALL' | 'DENIED' | 'ENDED';

const ENDED_TEXT = /removed from the meeting|you left the meeting|the call has ended|call ended/i;
const DENIED_TEXT = /can't join this call|denied your request|no one responded|you can.t join/i;
const WAITING_TEXT = /asking to join|someone in the call lets you in|waiting for the host/i;
const LEAVE = /leave call/i;

/** Opens Chrome on the trip's display, playing audio into the trip's sink. */
export async function openBrowser(stage: Stage, profileDir: string): Promise<BrowserContext> {
  return chromium.launchPersistentContext(profileDir, {
    executablePath: config.chromePath,
    headless: false,
    viewport: SCREEN,
    locale: 'en-US',
    env: { ...process.env, DISPLAY: stage.display, PULSE_SINK: stage.sink },
    // Fake camera and microphone, both switched off before joining: the bot only listens.
    args: [
      // The container has no user namespaces for Chrome's sandbox; the bot only opens Meet.
      '--no-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
      '--lang=en-US',
      '--password-store=basic',
      '--no-first-run',
      '--disable-notifications',
      `--window-size=${SCREEN.width},${SCREEN.height}`,
      '--kiosk',
    ],
    permissions: ['microphone', 'camera'],
  });
}

async function clickIfThere(page: Page, name: RegExp): Promise<boolean> {
  const button = page.getByRole('button', { name }).first();
  if (await button.isVisible().catch(() => false)) {
    await button.click();
    return true;
  }
  return false;
}

/**
 * Opens the call, switches the camera and microphone off, fills the guest name when signed
 * out, and asks to join. The host may still have to admit the bot.
 */
export async function askToJoin(page: Page, meetUrl: string, botName: string): Promise<void> {
  await page.goto(`${meetUrl}?hl=en`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const name = page.getByRole('textbox', { name: /your name/i });
  if (await name.isVisible().catch(() => false)) {
    await name.fill(botName);
  }
  await clickIfThere(page, /turn off microphone/i);
  await clickIfThere(page, /turn off camera/i);
  const join = page.getByRole('button', { name: /^(join now|ask to join|join)$/i }).first();
  await join.waitFor({ state: 'visible', timeout: 60_000 });
  await join.click();
}

/** Reads the call state from what Meet shows right now. */
export async function callState(page: Page): Promise<CallState> {
  const text = await page
    .locator('body')
    .innerText({ timeout: 5000 })
    .catch(() => '');
  if (ENDED_TEXT.test(text)) {
    return 'ENDED';
  }
  if (DENIED_TEXT.test(text)) {
    return 'DENIED';
  }
  if (
    await page
      .getByRole('button', { name: LEAVE })
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    return 'IN_CALL';
  }
  return WAITING_TEXT.test(text) ? 'WAITING' : 'LOBBY';
}

/** Other people in the call, counted from the video tiles Meet draws (the bot is one of them). */
export async function othersInCall(page: Page): Promise<number> {
  const ids = await page
    .locator('[data-participant-id]')
    .evaluateAll(
      (nodes) => new Set(nodes.map((node) => node.getAttribute('data-participant-id'))).size,
    )
    .catch(() => 2);
  return Math.max(0, ids - 1);
}

/** Posts the recording notice in the call's chat. Hosts can turn chat off, so this may fail. */
export async function postInChat(page: Page, message: string): Promise<boolean> {
  try {
    await clickIfThere(page, /chat with everyone/i);
    const box = page.getByRole('textbox', { name: /send a message/i }).first();
    await box.waitFor({ state: 'visible', timeout: 10_000 });
    await box.fill(message);
    await box.press('Enter');
    await page.waitForTimeout(1000);
    await clickIfThere(page, /chat with everyone/i);
    return true;
  } catch (error) {
    log('warn', 'Could not post in the meeting chat', { err: errorText(error) });
    return false;
  }
}

/** Leaves the call politely; a closed browser leaves too, so failures are ignored. */
export async function leave(page: Page): Promise<void> {
  await clickIfThere(page, LEAVE).catch(() => false);
}
