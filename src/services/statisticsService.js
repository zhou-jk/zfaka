/**
 * 统计服务层
 */

const db = require('../utils/database');
const redis = require('../utils/redis');
const logger = require('../utils/logger');
const { formatDate } = require('../utils/helpers');

class StatisticsService {
  /**
   * 获取仪表盘统计数据
   */
  async getDashboardStats() {
    // 今日统计
    const today = formatDate(new Date(), 'YYYY-MM-DD');
    const todayStats = await this.getDailyStats(today);
    
    // 昨日统计
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday, 'YYYY-MM-DD');
    const yesterdayStats = await this.getDailyStats(yesterdayStr);
    
    // 总体统计
    const totalStats = await this.getTotalStats();
    
    // 库存统计
    const stockStats = await this.getStockStats();
    
    // 待处理统计
    const pendingStats = await this.getPendingStats();
    
    return {
      today: todayStats,
      yesterday: yesterdayStats,
      total: totalStats,
      stock: stockStats,
      pending: pendingStats,
    };
  }
  
  /**
   * 获取指定日期的统计
   */
  async getDailyStats(date) {
    const startTime = `${date} 00:00:00`;
    const endTime = `${date} 23:59:59`;
    
    const stats = await db.queryOne(`
      SELECT 
        COUNT(*) as order_count,
        SUM(CASE WHEN order_status = 3 THEN 1 ELSE 0 END) as completed_count,
        COALESCE(SUM(CASE WHEN order_status = 3 THEN paid_amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN order_status = 3 THEN quantity ELSE 0 END), 0) as sold_count
      FROM order_main
      WHERE created_at >= ? AND created_at <= ?
    `, [startTime, endTime]);
    
    return {
      order_count: stats.order_count || 0,
      completed_count: stats.completed_count || 0,
      paid_amount: parseFloat(stats.paid_amount) || 0,
      sold_count: stats.sold_count || 0,
    };
  }
  
  /**
   * 获取总体统计
   */
  async getTotalStats() {
    const stats = await db.queryOne(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN order_status = 3 THEN 1 ELSE 0 END) as completed_orders,
        COALESCE(SUM(CASE WHEN order_status = 3 THEN paid_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN order_status = 3 THEN quantity ELSE 0 END), 0) as total_sold
      FROM order_main
    `);
    
    const userCount = await db.queryOne('SELECT COUNT(*) as count FROM sys_user WHERE role = 2');
    const productCount = await db.queryOne('SELECT COUNT(*) as count FROM product WHERE status = 1');
    
    return {
      total_orders: stats.total_orders || 0,
      completed_orders: stats.completed_orders || 0,
      total_revenue: parseFloat(stats.total_revenue) || 0,
      total_sold: stats.total_sold || 0,
      user_count: userCount.count || 0,
      product_count: productCount.count || 0,
    };
  }
  
  /**
   * 获取库存统计
   */
  async getStockStats() {
    const stats = await db.queryOne(`
      SELECT 
        COUNT(*) as total_cards,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as sold,
        SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) as voided
      FROM card_code
    `);
    
    // 库存预警（可用卡密少于10的商品）
    const lowStock = await db.query(`
      SELECT p.id, p.name, p.stock_count
      FROM product p
      WHERE p.status = 1 AND p.stock_count < 10
      ORDER BY p.stock_count ASC
      LIMIT 10
    `);
    
    return {
      total: stats.total_cards || 0,
      available: stats.available || 0,
      sold: stats.sold || 0,
      voided: stats.voided || 0,
      low_stock_products: lowStock,
    };
  }
  
  /**
   * 获取待处理统计
   */
  async getPendingStats() {
    const pendingOrders = await db.queryOne(
      'SELECT COUNT(*) as count FROM order_main WHERE order_status = 4'
    );
    
    const pendingPayments = await db.queryOne(
      'SELECT COUNT(*) as count FROM order_main WHERE order_status IN (0, 1) AND expire_time > NOW()'
    );
    
    return {
      manual_orders: pendingOrders.count || 0,
      pending_payments: pendingPayments.count || 0,
    };
  }
  
  /**
   * 获取趋势数据（最近N天）
   */
  async getTrendData(days = 7) {
    const result = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date, 'YYYY-MM-DD');
      
      const stats = await this.getDailyStats(dateStr);
      result.push({
        date: dateStr,
        ...stats,
      });
    }
    
    return result;
  }
  
  /**
   * 获取商品销量排行
   */
  async getProductRanking(limit = 10, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = formatDate(startDate, 'YYYY-MM-DD');
    
    const ranking = await db.query(`
      SELECT 
        o.product_id,
        o.product_name,
        p.price as current_price,
        COUNT(*) as order_count,
        SUM(o.quantity) as total_quantity,
        SUM(o.paid_amount) as total_amount
      FROM order_main o
      LEFT JOIN product p ON o.product_id = p.id
      WHERE o.order_status = 3 
        AND o.created_at >= ?
      GROUP BY o.product_id, o.product_name
      ORDER BY total_quantity DESC
      LIMIT ?
    `, [startDateStr, limit]);
    
    return ranking;
  }
  
  /**
   * 获取支付渠道统计
   */
  async getChannelStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = formatDate(startDate, 'YYYY-MM-DD');
    
    const stats = await db.query(`
      SELECT 
        pay_channel,
        COUNT(*) as order_count,
        SUM(paid_amount) as total_amount
      FROM order_main
      WHERE order_status = 3 
        AND pay_channel IS NOT NULL
        AND created_at >= ?
      GROUP BY pay_channel
      ORDER BY total_amount DESC
    `, [startDateStr]);
    
    return stats;
  }
  
  /**
   * 获取操作日志列表
   */
  async getOperationLogs(params = {}) {
    const { page = 1, limit = 20, operator_id, op_type, start_date, end_date } = params;
    
    let sql = `
      SELECT l.*, u.username as operator_username
      FROM operation_log l
      LEFT JOIN sys_user u ON l.operator_id = u.id
      WHERE 1=1
    `;
    const sqlParams = [];
    
    if (operator_id) {
      sql += ' AND l.operator_id = ?';
      sqlParams.push(operator_id);
    }
    
    if (op_type) {
      sql += ' AND l.op_type = ?';
      sqlParams.push(op_type);
    }
    
    if (start_date) {
      sql += ' AND l.created_at >= ?';
      sqlParams.push(start_date);
    }
    
    if (end_date) {
      sql += ' AND l.created_at <= ?';
      sqlParams.push(end_date + ' 23:59:59');
    }
    
    sql += ' ORDER BY l.id DESC';
    
    return await db.paginate(sql, sqlParams, page, limit);
  }
  
  /**
   * 记录每日统计数据（定时任务调用）
   */
  async recordDailyStats(date = null) {
    const targetDate = date || formatDate(new Date(Date.now() - 86400000), 'YYYY-MM-DD');
    
    // 检查是否已存在
    const existing = await db.queryOne(
      'SELECT id FROM statistics_daily WHERE stat_date = ?',
      [targetDate]
    );
    
    const stats = await this.getDailyStats(targetDate);
    
    // 获取卡密导入数量
    const cardImport = await db.queryOne(`
      SELECT COALESCE(SUM(success_count), 0) as count
      FROM card_import_batch
      WHERE DATE(created_at) = ?
    `, [targetDate]);
    
    const data = {
      stat_date: targetDate,
      order_count: stats.order_count,
      paid_order_count: stats.completed_count,
      total_amount: stats.paid_amount,
      paid_amount: stats.paid_amount,
      card_sold_count: stats.sold_count,
      card_import_count: cardImport.count || 0,
    };
    
    if (existing) {
      await db.update('statistics_daily', data, { id: existing.id });
    } else {
      await db.insert('statistics_daily', data);
    }
    
    logger.info(`已记录 ${targetDate} 统计数据`);
    return data;
  }
  
  /**
   * 获取历史统计数据
   */
  async getHistoryStats(startDate, endDate) {
    return await db.query(
      `SELECT * FROM statistics_daily 
       WHERE stat_date >= ? AND stat_date <= ?
       ORDER BY stat_date ASC`,
      [startDate, endDate]
    );
  }
}

module.exports = new StatisticsService();
