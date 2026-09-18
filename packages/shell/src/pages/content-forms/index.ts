/**
 * Content forms shared between the portal that owns a register and IT, which keeps its own
 * slice of it: knowledge-base articles (Support), announcements (HR) and policies (Legal).
 * Each takes the categories its screen may offer, so IT's copy of a form only offers IT's.
 */
export { KbArticleForm, type KbArticleRow } from './kb-article';
export { AnnouncementForm, type AnnouncementRow } from './announcement';
export { PolicyForm, usePublishPolicy, type PolicyRow } from './policy';
