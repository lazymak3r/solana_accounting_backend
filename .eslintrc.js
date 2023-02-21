module.exports = {
  extends: [
    '@antfu/eslint-config-ts',
  ],
  rules: {
    'curly': ['error', 'all'],
    'antfu/if-newline': 'off',
    '@typescript-eslint/brace-style': ['error', '1tbs'],
    '@typescript-eslint/consistent-type-imports': 'off',
    'no-console': 'off',
  },
}
