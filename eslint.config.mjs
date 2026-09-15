import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'coverage/**'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // §1.6: enabled at error severity so dead code like the removed
      // unused ScoreDial constants gets caught by CI, not a future reader.
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
];

export default eslintConfig;
