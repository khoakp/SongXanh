import nextVitals from 'eslint-config-next/core-web-vitals'

export default [
  ...nextVitals,
  { ignores: ['.next/**', 'node_modules/**', 'test-results/**', 'playwright-report/**', 'e2e/**'] },
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'warn',
      '@next/next/no-img-element': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]
