/**
 * Deux projets distincts (docs/engineering/strategie-de-tests.md) :
 *
 *  - `domain` : TypeScript pur, environnement Node, aucune dépendance React Native.
 *               C'est là qu'est le risque réel (calculs invisibles à l'œil),
 *               et ça doit rester sous les 5 secondes.
 *  - `app`    : composants et repositories, via le preset jest-expo, plus lent.
 */
const moduleNameMapper = { '^@/(.*)$': '<rootDir>/src/$1' };

module.exports = {
  projects: [
    {
      displayName: 'domain',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/domain/**/*.test.ts', '<rootDir>/src/lib/**/*.test.ts'],
      transform: { '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.config.js' }] },
      moduleNameMapper,
    },
    {
      displayName: 'app',
      preset: 'jest-expo',
      testMatch: [
        '<rootDir>/src/data/**/*.test.ts',
        '<rootDir>/src/features/**/*.test.tsx',
        '<rootDir>/src/ui/**/*.test.tsx',
      ],
      moduleNameMapper,
    },
  ],
  // On ne mesure que le code pur, là où une erreur serait invisible à l'œil.
  // Les fichiers de câblage (i18n, source d'aléa native) sont exercés en lançant
  // l'application, pas en test unitaire : les compter fausserait la mesure.
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    'src/lib/**/*.ts',
    '!src/**/*.test.ts',
    '!src/lib/i18n/**',
    '!src/lib/id/index.ts',
  ],
  coverageThreshold: {
    './src/lib/': { statements: 90, branches: 90, functions: 90, lines: 90 },
    // Le seuil de 90 % sur ./src/domain/ sera ajouté avec ses premiers modules (M1) :
    // Jest échoue si un chemin de seuil ne contient aucun fichier.
  },
};
