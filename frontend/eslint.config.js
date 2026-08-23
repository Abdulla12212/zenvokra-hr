import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'node_modules'],
  },

  js.configs.recommended,

  // Type-aware linting: these rules read the type checker, which catches whole
  // classes of bug that syntax-only rules cannot (unawaited promises, unsafe `any`).
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Type-only imports must say so: the bundler strips imports without reading
      // types, so a value import of a type would survive into the output.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // A floating promise is a request whose failure nobody hears about.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Escape hatches should be visible in review, not silent.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },

  // Config files run in Node, not the browser.
  {
    files: ['*.config.{ts,js}', 'vitest.setup.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // shadcn/ui primitives are copied in from the registry and deliberately export
  // variant helpers next to their component, which the fast-refresh rule dislikes.
  // Keeping them as published means the CLI can update them later without conflicts.
  {
    files: ['src/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // typescript-eslint cannot type-check plain JS that no tsconfig covers.
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.node,
    },
  },
);
