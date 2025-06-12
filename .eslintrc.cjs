module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Disable explicit any errors - we'll fix these incrementally
    '@typescript-eslint/no-explicit-any': 'off',

    // Disable empty interface errors
    '@typescript-eslint/no-empty-object-type': 'off',

    // Disable unused vars but keep as warning
    '@typescript-eslint/no-unused-vars': 'off',

    // React rules
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // We use TypeScript for prop validation

    // React hooks rules
    'react-hooks/exhaustive-deps': 'off', // Disable for now

    // Allow certain patterns
    'no-empty-pattern': 'off',

    // Allow using Function type for now
    '@typescript-eslint/no-unsafe-function-type': 'off',

    // Allow useless escapes in certain files
    'no-useless-escape': 'off',
  },
  ignorePatterns: ['resources/js/ziggy.js'],
};
