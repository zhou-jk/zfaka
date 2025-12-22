/**
 * 订单服务单元测试
 */

// Mock 数据库和 Redis
jest.mock('../../../src/utils/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  transaction: jest.fn(),
}));

jest.mock('../../../src/utils/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

const db = require('../../../src/utils/database');
const orderService = require('../../../src/services/orderService');

describe('OrderService', () => {
  beforeEach(() => {
    // 每个测试前重置所有 mock
    jest.clearAllMocks();
  });

  describe('getOrderByNo', () => {
    it('应该返回订单信息（订单存在）', async () => {
      const mockOrder = {
        id: 1,
        order_no: 'ZF202512220001',
        product_id: 1,
        quantity: 1,
        total_amount: '10.00',
        order_status: 0,
      };

      db.queryOne.mockResolvedValue(mockOrder);

      const result = await orderService.getOrderByNo('ZF202512220001');

      expect(result).toEqual(mockOrder);
      expect(db.queryOne).toHaveBeenCalledTimes(1);
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('order_no'),
        ['ZF202512220001']
      );
    });

    it('应该返回 null（订单不存在）', async () => {
      db.queryOne.mockResolvedValue(null);

      const result = await orderService.getOrderByNo('NOTEXIST');

      expect(result).toBeNull();
    });
  });

  describe('queryOrders', () => {
    it('应该通过订单号查询订单', async () => {
      const mockOrders = [
        { id: 1, order_no: 'ZF202512220001', product_name: '测试商品' },
      ];

      db.query.mockResolvedValue(mockOrders);

      const result = await orderService.queryOrders({ order_no: 'ZF202512220001' });

      expect(result).toEqual(mockOrders);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('应该通过邮箱查询订单', async () => {
      const mockOrders = [
        { id: 1, order_no: 'ZF202512220001', buyer_email: 'test@example.com' },
      ];

      db.query.mockResolvedValue(mockOrders);

      const result = await orderService.queryOrders({ email: 'test@example.com' });

      expect(result).toEqual(mockOrders);
    });

    it('应该抛出错误（无查询条件）', async () => {
      await expect(orderService.queryOrders({})).rejects.toThrow();
    });
  });
});
