import { portalEslintConfig } from '@exyconn/config/eslint';

// This package IS the MUI wrapper, so it is the one place allowed to import @mui/* directly.
export default portalEslintConfig({ muiAllowed: ['src/**'] });
