const portalEslintConfig = require('../../eslint.portal.cjs');

// The design-system wrapper, theme construction and the date-adapter wiring are
// the only places allowed to reach for MUI directly.
module.exports = portalEslintConfig({
  uiImport: '@/components/ui',
  muiAllowed: ['src/components/ui/**', 'src/config/theme.ts', 'src/theme/**', 'src/app/**'],
});
