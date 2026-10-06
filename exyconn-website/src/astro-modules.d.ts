/**
 * For plain `tsc` (the second half of `pnpm typecheck`), which cannot read .astro files: a
 * .ts module that imports components — src/components/cms/registry.ts — sees each as a
 * component taking any props. `astro check` resolves the real files and their real props.
 */
declare module "*.astro" {
  const component: (props: Record<string, unknown>) => unknown;
  export default component;
}
