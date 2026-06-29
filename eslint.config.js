import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'dev-dist']),
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // Node scripts and tooling configs run under Node, not the browser.
  {
    files: ['scripts/**/*.{js,mjs}', '*.config.{js,ts}', 'vite.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Test files have Vitest globals (describe/it/expect/vi) and Node access.
  {
    files: ['**/*.test.{ts,tsx,js,jsx}', 'src/test/**/*.{ts,js}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
  },
])
