module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],
  
  // 覆盖率配置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js', // 排除入口文件
    '!src/views/**', // 排除视图文件
  ],
  
  // 覆盖率阈值（可根据需要调整）
  // 目前暂时禁用阈值，等测试覆盖率提高后再启用
  // coverageThreshold: {
  //   global: {
  //     branches: 50,
  //     functions: 50,
  //     lines: 50,
  //     statements: 50,
  //   },
  // },
  
  // 测试超时时间（毫秒）
  testTimeout: 10000,
  
  // 在每个测试文件执行前运行的设置文件
  setupFilesAfterEnv: ['./tests/setup.js'],
  
  // 模块路径别名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // 详细输出
  verbose: true,
  
  // 检测打开的句柄（调试用，生产环境可关闭）
  detectOpenHandles: false,
};
