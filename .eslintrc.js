const sonarJsConfig = require('eslint-plugin-sonarjs').configs.recommended.rules;

module.exports = {
  plugins: ['sonarjs', 'no-only-tests'],
  extends: ['@open-wc/eslint-config', 'eslint-config-prettier'].map(require.resolve),
  rules: {
    ...sonarJsConfig,
    'no-only-tests/no-only-tests': 'error',
    'class-methods-use-this': [
      'error',
      { exceptMethods: ['render', 'emits', 'renderHeader', 'renderPage'] },
    ],
    'max-lines': ['warn', { max: 200 }],
    complexity: ['error', { max: 10 }],
    'max-nested-callbacks': ['error', { max: 2 }],
    'max-depth': ['error', { max: 2 }],
    'max-params': ['error', { max: 3 }],
    'import/no-extraneous-dependencies': ['off'],
    'import/extensions': ['off'],
    'lit/no-invalid-html': ['off'],
    'no-return-assign': ['error', 'except-parens'],
  },
};
