/**
 * 工具函数单元测试
 */

const { 
  generateOrderNo, 
  parsePagination, 
  formatDate,
  getClientIp,
} = require('../../../src/utils/helpers');

describe('Helpers', () => {
  describe('generateOrderNo', () => {
    it('应该生成以 ZF 开头的订单号', () => {
      const orderNo = generateOrderNo();
      
      expect(orderNo).toMatch(/^ZF\d{18}$/);
    });

    it('应该生成唯一的订单号', () => {
      const orderNo1 = generateOrderNo();
      const orderNo2 = generateOrderNo();
      
      expect(orderNo1).not.toBe(orderNo2);
    });

    it('应该包含当前日期', () => {
      const orderNo = generateOrderNo();
      const today = new Date();
      const dateStr = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('');
      
      expect(orderNo).toContain(dateStr);
    });
  });

  describe('parsePagination', () => {
    it('应该返回默认分页参数', () => {
      const result = parsePagination({});
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('应该解析有效的分页参数', () => {
      const result = parsePagination({ page: '2', limit: '10' });
      
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('应该处理无效的分页参数', () => {
      const result = parsePagination({ page: 'abc', limit: 'xyz' });
      
      // 无效字符串会被解析为 NaN，然后使用默认值
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('应该限制最大分页数', () => {
      const result = parsePagination({ limit: '1000' });
      
      expect(result.limit).toBeLessThanOrEqual(100);
    });
  });

  describe('formatDate', () => {
    it('应该格式化日期', () => {
      const date = new Date('2025-12-22T10:30:00');
      const result = formatDate(date);
      
      expect(result).toContain('2025');
      expect(result).toContain('12');
      expect(result).toContain('22');
    });

    it('应该处理字符串日期', () => {
      const result = formatDate('2025-12-22');
      
      expect(result).toBeDefined();
    });

    it('应该返回空字符串（无效日期）', () => {
      const result = formatDate(null);
      
      expect(result).toBe('');
    });
  });

  describe('getClientIp', () => {
    it('应该从 x-forwarded-for 获取 IP', () => {
      const mockReq = {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
        ip: '127.0.0.1',
      };
      
      const result = getClientIp(mockReq);
      
      expect(result).toBe('192.168.1.1');
    });

    it('应该从 x-real-ip 获取 IP', () => {
      const mockReq = {
        headers: { 'x-real-ip': '192.168.1.2' },
        ip: '127.0.0.1',
      };
      
      const result = getClientIp(mockReq);
      
      expect(result).toBe('192.168.1.2');
    });

    it('应该返回 req.ip 作为后备', () => {
      const mockReq = {
        headers: {},
        ip: '127.0.0.1',
      };
      
      const result = getClientIp(mockReq);
      
      expect(result).toBe('127.0.0.1');
    });
  });
});
