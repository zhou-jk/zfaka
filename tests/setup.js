/**
 * Jest 测试环境设置
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 设置测试超时
jest.setTimeout(10000);

// 全局 Mock（可选）
// jest.mock('../src/utils/redis');
// jest.mock('../src/utils/database');

// 测试前后的钩子
beforeAll(async () => {
  // 测试开始前的全局设置
  console.log('🧪 开始运行测试...');
});

afterAll(async () => {
  // 测试结束后的清理工作
  console.log('✅ 测试运行完成');
  
  // 清理所有 mock
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
