const portalEslintConfig = require('@exyconn/config/eslint');

// This package IS the MUI wrapper, so it is the one place allowed to import @mui/* directly.
module.exports = portalEslintConfig({ muiAllowed: ['src/**'] });
