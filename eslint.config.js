import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,

  prettierConfig,

  {
    files: ['packages/**/*.js'],

    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'commonjs',
    },

    rules: {
      'no-console': 'warn',

      'no-unused-vars': ['warn', { args: 'none' }],

      'no-empty': 'warn',
    },
  },
];
