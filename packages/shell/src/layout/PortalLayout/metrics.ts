/** The fixed topbar's height — room for its round buttons. The sidebar's logo row matches it. */
export const TOPBAR_HEIGHT = 64;

/**
 * The side gutter the page content and the topbar both keep, in theme spacing steps.
 *
 * One constant because the two have to agree: a topbar whose padding drifts from the content
 * well below it puts the page title out of line with everything on the page, and the drift is
 * invisible until somebody notices the whole portal looks slightly crooked.
 */
export const PAGE_GUTTER = { xs: 1.5, md: 2 };
