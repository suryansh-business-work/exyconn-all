import { DESCRIPTION_LIMIT, TITLE_LIMIT } from './constants';
import type { PageMeta, SeoWarning } from './types';
import { isAbsoluteUrl } from './url';

/** Length limits; the defaults are where search results truncate. */
export interface AuditLimits {
  readonly title?: number;
  readonly description?: number;
}

function lengthWarnings(meta: PageMeta, limits: AuditLimits): SeoWarning[] {
  const titleLimit = limits.title ?? TITLE_LIMIT;
  const descriptionLimit = limits.description ?? DESCRIPTION_LIMIT;
  const warnings: SeoWarning[] = [];
  if (meta.title.trim() === '') {
    warnings.push({ field: 'title', message: 'Title is empty.' });
  } else if (meta.title.length > titleLimit) {
    warnings.push({
      field: 'title',
      message: `Title is ${meta.title.length} characters; results show about ${titleLimit}.`,
    });
  }
  if (meta.description.trim() === '') {
    warnings.push({ field: 'description', message: 'Description is empty.' });
  } else if (meta.description.length > descriptionLimit) {
    warnings.push({
      field: 'description',
      message: `Description is ${meta.description.length} characters; results show about ${descriptionLimit}.`,
    });
  }
  return warnings;
}

function linkWarnings(meta: PageMeta): SeoWarning[] {
  const warnings: SeoWarning[] = [];
  if (!isAbsoluteUrl(meta.canonical)) {
    warnings.push({ field: 'canonical', message: 'Canonical must be an absolute http(s) URL.' });
  }
  if (!meta.image) {
    warnings.push({ field: 'image', message: 'No share image; social cards will be text only.' });
  } else if (!meta.image.alt) {
    warnings.push({ field: 'image', message: 'Share image has no alt text.' });
  }
  return warnings;
}

/**
 * Problems worth fixing in a page's meta. Guidance only: nothing is truncated or changed,
 * because a cut-off title reads worse than a long one.
 */
export function auditMeta(meta: PageMeta, limits: AuditLimits = {}): SeoWarning[] {
  return [...lengthWarnings(meta, limits), ...linkWarnings(meta)];
}
