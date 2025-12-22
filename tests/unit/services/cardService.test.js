/**
 * 卡密服务单元测试
 */

// Mock 数据库
jest.mock('../../../src/utils/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  beginTransaction: jest.fn(),
}));

const db = require('../../../src/utils/database');
const cardService = require('../../../src/services/cardService');

describe('CardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCardList', () => {
    it('应该返回卡密列表', async () => {
      const mockCards = [
        { id: 1, card_code: 'CODE001', status: 0 },
        { id: 2, card_code: 'CODE002', status: 0 },
      ];

      db.query.mockResolvedValue(mockCards);

      const result = await cardService.getCardList({ product_id: 1 });

      expect(result).toBeDefined();
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('getCardStats', () => {
    it('应该返回卡密统计信息', async () => {
      const mockStats = [
        { status: 0, count: 10 },
        { status: 1, count: 5 },
        { status: 2, count: 2 },
      ];

      db.query.mockResolvedValue(mockStats);

      const result = await cardService.getCardStats(1);

      expect(result).toBeDefined();
    });
  });

  describe('voidCard', () => {
    it('应该作废卡密（卡密存在且可用）', async () => {
      const mockCard = { id: 1, status: 0, product_id: 1 };

      db.queryOne.mockResolvedValue(mockCard);
      db.update.mockResolvedValue({ affectedRows: 1 });

      const result = await cardService.voidCard(1);

      expect(result).toBe(true);
      expect(db.update).toHaveBeenCalledWith(
        'card_code',
        expect.objectContaining({ status: 2 }),
        { id: 1 }
      );
    });

    it('应该抛出错误（卡密不存在）', async () => {
      db.queryOne.mockResolvedValue(null);

      await expect(cardService.voidCard(999)).rejects.toThrow();
    });
  });

  describe('restoreCard', () => {
    it('应该恢复已作废的卡密', async () => {
      const mockCard = { id: 1, status: 2, product_id: 1 };

      db.queryOne.mockResolvedValue(mockCard);
      db.update.mockResolvedValue({ affectedRows: 1 });

      const result = await cardService.restoreCard(1);

      expect(result).toBe(true);
      expect(db.update).toHaveBeenCalledWith(
        'card_code',
        expect.objectContaining({ status: 0 }),
        { id: 1 }
      );
    });
  });
});
