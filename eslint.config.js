// ESLint flat config. Voir docs/engineering/conventions-code.md
// Le plugin `import` est déjà fourni par eslint-config-expo : le redéclarer ici
// ferait échouer ESLint ("Cannot redefine plugin"). On ne fait qu'en régler les règles.
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'src/data/db/migrations/*'],
  },
  {
    rules: {
      // ── Frontières entre couches (docs/architecture/overview.md) ──
      // Une règle non outillée n'est pas une règle, c'est un vœu.
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/domain',
              from: './src/data',
              message: 'Le domaine ne connaît pas la couche données.',
            },
            {
              target: './src/domain',
              from: './src/app',
              message: "Le domaine ne connaît pas l'UI.",
            },
            {
              target: './src/domain',
              from: './src/features',
              message: "Le domaine ne connaît pas l'UI.",
            },
            {
              target: './src/app',
              from: './src/data/db',
              message: 'Passe par un repository (src/data/repositories).',
            },
            {
              target: './src/features',
              from: './src/data/db',
              message: 'Passe par un repository (src/data/repositories).',
            },
            {
              target: './src/ui',
              from: './src/domain',
              message: "Les composants génériques n'ont pas de métier.",
            },
            {
              target: './src/ui',
              from: './src/data',
              message: "Les composants génériques n'accèdent pas aux données.",
            },
          ],
        },
      ],

      // ── Règles projet ──
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
  {
    // eslint-config-expo n'enregistre le plugin @typescript-eslint que sur les
    // fichiers TS : ses règles doivent donc être limitées au même périmètre.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Le domaine est du TypeScript pur : aucun import de React ni de React Native.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'Le domaine est du TypeScript pur.' },
            { name: 'react-native', message: 'Le domaine est du TypeScript pur.' },
            { name: 'expo-sqlite', message: 'Le domaine ne fait aucune I/O.' },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__fixtures__/**'],
    rules: {
      'no-console': 'off',
    },
  },
];
