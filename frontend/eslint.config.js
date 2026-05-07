import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Context/Hooks pattern is ok in this app
      'react-refresh/only-export-components': 'off',
      // This rule is noisy with "fetch in effect" patterns
      'react-hooks/set-state-in-effect': 'off',
      // Allow small inner components for layout composition
      'react-hooks/static-components': 'off',
    },
  },
])
