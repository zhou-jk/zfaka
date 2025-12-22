module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // 代码风格
    'indent': ['error', 2, { SwitchCase: 1 }],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    
    // 最佳实践
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': 'off', // 允许 console（服务端开发常用）
    'no-debugger': 'warn',
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    'curly': ['error', 'all'],
    'no-var': 'error',
    'prefer-const': 'warn',
    
    // 异步处理
    'no-async-promise-executor': 'error',
    'require-await': 'off', // 允许空 async 函数
    'no-return-await': 'off', // 允许 return await（更清晰的错误堆栈）
    
    // 安全相关
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
  },
  ignorePatterns: [
    'node_modules/',
    'public/',
    '*.min.js',
  ],
};
