/**
 * Reports what happens in the demo to the portal (Admin > WhatsApp demo analytics): batched,
 * every event with its own id so a retried batch never double-counts. Free text the viewer
 * types is never sent — a text step reports which kind of answer it was.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  useRecordWhatsappDemoEventsMutation,
  WhatsappDemoEventType,
  type WhatsappDemoEventInput,
} from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { RuntimeSignal } from '../runtime/types';
import { deviceClass, newId, sessionId } from './session';

const FLUSH_MS = 5000;
const BATCH = 20;
const LABEL_MAX = 80;

export type UiSignal = { type: 'DOCUMENT_OPENED' | 'QR_OPENED'; demoKey: string; label: string };

/** The wire enum, looked up by the signal names the engine and screens emit. */
const EVENT_TYPES = new Map<string, WhatsappDemoEventType>(
  Object.values(WhatsappDemoEventType).map((v) => [v, v]),
);

type Fields = Omit<WhatsappDemoEventInput, 'id' | 'sessionId' | 'type' | 'at'>;

function fieldsOf(signal: RuntimeSignal | UiSignal): Fields {
  const fields: Fields = { demoKey: signal.demoKey };
  if ('workflow' in signal) {
    fields.workflow = signal.workflow;
    fields.node = signal.node;
  }
  if ('stepKind' in signal) {
    fields.stepKind = signal.stepKind;
  }
  if ('label' in signal) {
    fields.label = signal.label.slice(0, LABEL_MAX);
  }
  return fields;
}

export function useDemoAnalytics() {
  const [record] = useRecordWhatsappDemoEventsMutation();
  const session = useMemo(sessionId, []);
  const queue = useRef<WhatsappDemoEventInput[]>([]);
  const started = useRef(Date.now());

  const flush = useCallback(() => {
    const events = queue.current.splice(0);
    if (events.length === 0) {
      return;
    }
    record({ variables: { events } }).catch((error: unknown) => {
      queue.current.unshift(...events);
      portalLogger.warn('wa-demo: analytics batch not sent', error);
    });
  }, [record]);

  const push = useCallback(
    (type: WhatsappDemoEventType, fields: Fields) => {
      queue.current.push({
        id: newId(),
        sessionId: session,
        type,
        at: new Date().toISOString(),
        ...fields,
      });
      if (queue.current.length >= BATCH) {
        flush();
      }
    },
    [flush, session],
  );

  const track = useCallback(
    (signal: RuntimeSignal | UiSignal) => {
      const type = EVENT_TYPES.get(signal.type);
      if (type) {
        push(type, fieldsOf(signal));
      }
    },
    [push],
  );

  useEffect(() => {
    const { innerWidth, innerHeight } = globalThis;
    push(WhatsappDemoEventType.SessionStart, {
      device: deviceClass(innerWidth),
      viewport: `${innerWidth}x${innerHeight}`,
    });
    const timer = globalThis.setInterval(flush, FLUSH_MS);
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        push(WhatsappDemoEventType.SessionEnd, { durationMs: Date.now() - started.current });
        flush();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      globalThis.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [flush, push]);

  return track;
}
