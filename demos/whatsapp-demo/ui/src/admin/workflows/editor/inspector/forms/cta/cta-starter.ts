import type { CtaAction } from '@exyconn/wa-flow';

export type CtaKind = CtaAction['kind'];

/** A valid action of a kind, keeping the title already typed. */
export function ctaStarter(kind: CtaKind, title: string): CtaAction {
  if (kind === 'call') {
    return { kind, title, phone: '' };
  }
  if (kind === 'calendar') {
    return { kind, title, event: { title: '', start: '{{slot}}', durationMin: 30 } };
  }
  return { kind, title, url: 'https://' };
}
