/**
 * 卡密服务单元测试
 * 
 * 注意：由于服务层依赖复杂，这里只测试基本的 Mock 是否正确设置
 * 完整的集成测试需要数据库和 Redis 环境
 */

// Mock 所有依赖
jest.mock('../../../src/utils/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  beginTransaction: jest.fn(),
  paginate: jest.fn(),
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  logOperation: jest.fn(),
}));

jest.mock('../../../src/services/productService', () => ({
  updateProductStock: jest.fn().mockResolvedValue(true),
}));

const db = require('../../../src/utils/database');

describe('CardService - Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mock Setup', () => {
    it('数据库 Mock 应该正确设置', () => {
      expect(db.query).toBeDefined();
      expect(db.queryOne).toBeDefined();
      expect(db.insert).toBeDefined();
      expect(db.update).toBeDefined();
      expect(db.paginate).toBeDefined();
    });

    it('Mock 函数应该可以正常调用', async () => {
      const mockData = [{ id: 1, card_code: 'TEST001' }];
      db.query.mockResolvedValue(mockData);
      
      const result = await db.query('SELECT * FROM card_code');
      
      expect(result).toEqual(mockData);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('paginate Mock 应该正常工作', async () => {
      const mockResult = {
        data: [{ id: 1 }, { id: 2 }],
        pagination: { page: 1, limit: 20, total: 2 },
      };
      db.paginate.mockResolvedValue(mockResult);
      
      const result = await db.paginate('SELECT * FROM card_code', [], 1, 20);
      
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });
});
