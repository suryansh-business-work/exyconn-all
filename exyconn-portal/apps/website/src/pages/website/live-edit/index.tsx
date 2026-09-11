import { lazy, Suspense, type ReactNode } from 'react';
import { RecordState } from './RecordState';

export { ArticleBodyField } from './ArticleBodyField';
export { LIVE_EDIT_ACTION } from './live-edit.action';

// GrapesJS is about a megabyte, so the editor screens load only when one is opened.
const BlogLiveEditPage = lazy(() =>
  import('./BlogLiveEditPage').then((module) => ({ default: module.BlogLiveEditPage })),
);
const CaseStudyLiveEditPage = lazy(() =>
  import('./CaseStudyLiveEditPage').then((module) => ({ default: module.CaseStudyLiveEditPage })),
);

function LiveEditSuspense({ children }: Readonly<{ children: ReactNode }>) {
  return <Suspense fallback={<RecordState loading label="live editor" />}>{children}</Suspense>;
}

export function BlogLiveEditRoute() {
  return (
    <LiveEditSuspense>
      <BlogLiveEditPage />
    </LiveEditSuspense>
  );
}

export function CaseStudyLiveEditRoute() {
  return (
    <LiveEditSuspense>
      <CaseStudyLiveEditPage />
    </LiveEditSuspense>
  );
}
