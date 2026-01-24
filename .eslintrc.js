module.exports = {
  root: true,
  extends: ['@react-native', 'prettier'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
