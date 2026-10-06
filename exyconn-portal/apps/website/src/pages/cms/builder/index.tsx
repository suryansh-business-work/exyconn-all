import { lazy, Suspense, type ReactNode } from 'react';
import { BuilderState } from './BuilderState';

// GrapesJS is about a megabyte, so the builders load only when one is opened.
const PageBuilderPage = lazy(() =>
  import('./PageBuilderPage').then((module) => ({ default: module.PageBuilderPage })),
);
const FragmentBuilderPage = lazy(() =>
  import('../fragments/FragmentBuilderPage').then((module) => ({
    default: module.FragmentBuilderPage,
  })),
);

function BuilderSuspense({ children }: Readonly<{ children: ReactNode }>) {
  return <Suspense fallback={<BuilderState loading label="page builder" />}>{children}</Suspense>;
}

export function PageBuilderRoute() {
  return (
    <BuilderSuspense>
      <PageBuilderPage />
    </BuilderSuspense>
  );
}

export function FragmentBuilderRoute() {
  return (
    <BuilderSuspense>
      <FragmentBuilderPage />
    </BuilderSuspense>
  );
}
