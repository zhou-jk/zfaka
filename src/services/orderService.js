/**
 * 订单服务层
 */

const db = require('../utils/database');
const redis = require('../utils/redis');
const logger = require('../utils/logger');
const config = require('../config');
const productService = require('./productService');
const cardService = require('./cardService');
const { BusinessError } = require('../middlewares/errorHandler');
const { ErrorCodes } = require('../utils/response');
const { generateOrderNo, getExpireTime, isExpired, getClientIp } = require('../utils/helpers');

// 订单状态枚举
const OrderStatus = {
  PENDING: 0,      // 待支付
  PAYING: 1,       // 支付中
  PAID: 2,         // 已支付待发货
  COMPLETED: 3,    // 已完成（已发货）
  MANUAL: 4,       // 待人工处理
  CANCELLED: 5,    // 已取消
  REFUNDED: 6,     // 已退款
};

// 发货状态
const DeliveryStatus = {
  PENDING: 0,      // 未发货
  DELIVERED: 1,    // 已发货
  FAILED: 2,       // 发货失败
};

class OrderService {
  /**
   * 创建订单
   */
  async createOrder(data, req) {
    const { product_id, quantity, email, phone } = data;
    
    // 获取商品信息
    const product = await productService.getProductWithStock(product_id);
    
    if (!product) {
      throw new BusinessError(ErrorCodes.PRODUCT_NOT_FOUND);
    }
    
    if (product.status !== 1) {
      throw new BusinessError(ErrorCodes.PRODUCT_OFF_SHELF);
    }
    
    // 验证数量
    if (quantity < product.min_quantity || quantity > product.max_quantity) {
      throw new BusinessError({
        code: 5010,
        message: `购买数量需在 ${product.min_quantity} - ${product.max_quantity} 之间`,
      });
    }
    
    // 检查库存
    if (product.stock_count < quantity) {
      throw new BusinessError(ErrorCodes.PRODUCT_STOCK_EMPTY);
    }
    
    // 计算金额
    const unitPrice = parseFloat(product.price);
    const totalAmount = (unitPrice * quantity).toFixed(2);
    
    // 生成订单号
    const orderNo = generateOrderNo();
    
    // 计算过期时间
    const expireTime = getExpireTime(config.order.expireMinutes);
    
    // 创建订单
    const orderData = {
      order_no: orderNo,
      buyer_email: email || null,
      buyer_phone: phone || null,
      product_id: product.id,
      product_name: product.name, // 快照
      quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      currency: 'CNY',
      order_status: OrderStatus.PENDING,
      expire_time: expireTime,
      client_ip: getClientIp(req),
      user_agent: req.get('user-agent') || null,
    };
    
    const result = await db.insert('order_main', orderData);
    
    logger.info(`订单创建成功: ${orderNo}`, {
      order_id: result.insertId,
      product_id,
      quantity,
      total_amount: totalAmount,
    });
    
    return {
      id: result.insertId,
      order_no: orderNo,
      product_name: product.name,
      quantity,
      unit_price: unitPrice,
      total_amount: parseFloat(totalAmount),
      expire_time: expireTime,
    };
  }
  
  /**
   * 根据订单号获取订单
   */
  async getOrderByNo(orderNo) {
    return await db.queryOne(
      `SELECT o.*, p.image as product_image
       FROM order_main o
       LEFT JOIN product p ON o.product_id = p.id
       WHERE o.order_no = ?`,
      [orderNo]
    );
  }
  
  /**
   * 根据ID获取订单
   */
  async getOrderById(id) {
    return await db.queryOne(
      `SELECT o.*, p.image as product_image
       FROM order_main o
       LEFT JOIN product p ON o.product_id = p.id
       WHERE o.id = ?`,
      [id]
    );
  }
  
  /**
   * 获取订单详情（包含卡密）
   */
  async getOrderDetail(orderNo) {
    const order = await this.getOrderByNo(orderNo);
    
    if (!order) {
      throw new BusinessError(ErrorCodes.ORDER_NOT_FOUND);
    }
    
    // 如果已完成，获取卡密
    if (order.order_status === OrderStatus.COMPLETED) {
      order.cards = await cardService.getCardsByOrderId(order.id);
    } else {
      order.cards = [];
    }
    
    return order;
  }
  
  /**
   * 查询订单（买家端）
   */
  async queryOrders(params) {
    const { order_no, email } = params;
    
    if (!order_no && !email) {
      throw new BusinessError({
        code: 5020,
        message: '请输入订单号或邮箱查询',
      });
    }
    
    let sql = `
      SELECT o.id, o.order_no, o.product_name, o.quantity, o.unit_price,
             o.total_amount, o.order_status, o.delivery_status, o.pay_time,
             o.created_at, p.image as product_image
      FROM order_main o
      LEFT JOIN product p ON o.product_id = p.id
      WHERE 1=1
    `;
    const sqlParams = [];
    
    if (order_no) {
      sql += ' AND o.order_no = ?';
      sqlParams.push(order_no);
    }
    
    if (email) {
      sql += ' AND o.buyer_email = ?';
      sqlParams.push(email);
    }
    
    sql += ' ORDER BY o.id DESC LIMIT 50';
    
    return await db.query(sql, sqlParams);
  }
  
  /**
   * 获取订单列表（后台）
   */
  async getOrderList(params = {}) {
    const { page = 1, limit = 20, order_no, email, status, product_id, start_date, end_date } = params;
    
    let sql = `
      SELECT o.*, p.name as product_name_current
      FROM order_main o
      LEFT JOIN product p ON o.product_id = p.id
      WHERE 1=1
    `;
    const sqlParams = [];
    
    if (order_no) {
      sql += ' AND o.order_no = ?';
      sqlParams.push(order_no);
    }
    
    if (email) {
      sql += ' AND o.buyer_email LIKE ?';
      sqlParams.push(`%${email}%`);
    }
    
    if (status !== undefined) {
      sql += ' AND o.order_status = ?';
      sqlParams.push(status);
    }
    
    if (product_id) {
      sql += ' AND o.product_id = ?';
      sqlParams.push(product_id);
    }
    
    if (start_date) {
      sql += ' AND o.created_at >= ?';
      sqlParams.push(start_date);
    }
    
    if (end_date) {
      sql += ' AND o.created_at <= ?';
      sqlParams.push(end_date + ' 23:59:59');
    }
    
    sql += ' ORDER BY o.id DESC';
    
    return await db.paginate(sql, sqlParams, page, limit);
  }

  /**
   * 订单统计（可按筛选条件）
   */
  async getOrderStats(params = {}) {
    const { order_no, email, status, product_id, start_date, end_date } = params;
    let sql = `
      SELECT
        COUNT(*) AS total,
        SUM(total_amount) AS total_amount,
        SUM(CASE WHEN order_status = 1 THEN 1 ELSE 0 END) AS paid,
        SUM(CASE WHEN order_status = 0 THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN order_status = 3 THEN 1 ELSE 0 END) AS delivered,
        SUM(CASE WHEN order_status = 1 THEN total_amount ELSE 0 END) AS paid_amount
      FROM order_main o
      WHERE 1=1
    `;
    const sqlParams = [];

    if (order_no) {
      sql += ' AND o.order_no = ?';
      sqlParams.push(order_no);
    }

    if (email) {
      sql += ' AND o.buyer_email LIKE ?';
      sqlParams.push(`%${email}%`);
    }

    if (status !== undefined) {
      sql += ' AND o.order_status = ?';
      sqlParams.push(status);
    }

    if (product_id) {
      sql += ' AND o.product_id = ?';
      sqlParams.push(product_id);
    }

    if (start_date) {
      sql += ' AND o.created_at >= ?';
      sqlParams.push(start_date);
    }

    if (end_date) {
      sql += ' AND o.created_at <= ?';
      sqlParams.push(end_date + ' 23:59:59');
    }

    const row = await db.queryOne(sql, sqlParams);
    // 防止 null 透传到模板
    return {
      total: row?.total || 0,
      total_amount: parseFloat(row?.total_amount || 0),
      paid: row?.paid || 0,
      pending: row?.pending || 0,
      delivered: row?.delivered || 0,
      paid_amount: parseFloat(row?.paid_amount || 0),
    };
  }
  
  /**
   * 更新订单状态
   */
  async updateOrderStatus(orderId, status, additionalData = {}) {
    const updateData = {
      order_status: status,
      ...additionalData,
    };
    
    if (status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED) {
      updateData.closed_at = new Date();
    }
    
    await db.update('order_main', updateData, { id: orderId });
    
    return true;
  }
  
  /**
   * 支付成功处理（核心流程）
   */
  async handlePaymentSuccess(orderId, paymentData, tx) {
    const order = await tx.queryOne('SELECT * FROM order_main WHERE id = ? FOR UPDATE', [orderId]);
    
    if (!order) {
      throw new BusinessError(ErrorCodes.ORDER_NOT_FOUND);
    }
    
    // 幂等检查：已支付的订单不再处理
    if (order.order_status >= OrderStatus.PAID) {
      logger.info(`订单已处理，跳过: ${order.order_no}`);
      return { success: true, skipped: true };
    }
    
    // 检查订单是否已取消
    if (order.order_status === OrderStatus.CANCELLED) {
      throw new BusinessError(ErrorCodes.ORDER_CANCELLED);
    }
    
    try {
      // 分配卡密
      const cards = await cardService.allocateCards(order.product_id, order.quantity, orderId, tx);
      
      // 创建发货记录
      for (const card of cards) {
        await tx.insert('delivery', {
          order_id: orderId,
          order_no: order.order_no,
          card_id: card.id,
          card_code: card.card_code,
          card_secret: card.card_secret,
          delivery_type: 1, // 自动发货
        });
      }
      
      // 更新订单状态
      await tx.update('order_main', {
        order_status: OrderStatus.COMPLETED,
        paid_amount: paymentData.paid_amount,
        pay_channel: paymentData.pay_channel,
        pay_time: paymentData.pay_time || new Date(),
        delivery_status: DeliveryStatus.DELIVERED,
        delivery_time: new Date(),
      }, { id: orderId });
      
      // 更新商品销量
      await tx.query(
        'UPDATE product SET sold_count = sold_count + ?, stock_count = stock_count - ? WHERE id = ?',
        [order.quantity, order.quantity, order.product_id]
      );
      
      logger.info(`订单发货成功: ${order.order_no}`, {
        order_id: orderId,
        card_count: cards.length,
      });
      
      return { success: true, cards };
      
    } catch (error) {
      // 发货失败，标记为待人工处理
      logger.error(`订单发货失败: ${order.order_no}`, error);
      
      await tx.update('order_main', {
        order_status: OrderStatus.MANUAL,
        paid_amount: paymentData.paid_amount,
        pay_channel: paymentData.pay_channel,
        pay_time: paymentData.pay_time || new Date(),
        delivery_status: DeliveryStatus.FAILED,
        admin_remark: `自动发货失败: ${error.message}`,
      }, { id: orderId });
      
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 手动发货（补发）
   */
  async manualDelivery(orderId, operatorId) {
    const order = await db.queryOne('SELECT * FROM order_main WHERE id = ?', [orderId]);
    
    if (!order) {
      throw new BusinessError(ErrorCodes.ORDER_NOT_FOUND);
    }
    
    if (order.order_status !== OrderStatus.MANUAL && order.order_status !== OrderStatus.PAID) {
      throw new BusinessError({
        code: 5030,
        message: '当前订单状态不支持手动发货',
      });
    }
    
    // 检查是否已有发货记录
    const existingDelivery = await db.queryOne(
      'SELECT COUNT(*) as count FROM delivery WHERE order_id = ?',
      [orderId]
    );
    
    if (existingDelivery.count > 0) {
      throw new BusinessError({
        code: 5031,
        message: '订单已有发货记录，请勿重复发货',
      });
    }
    
    // 使用事务处理
    return await db.transaction(async (tx) => {
      // 分配卡密
      const cards = await cardService.allocateCards(order.product_id, order.quantity, orderId, tx);
      
      // 创建发货记录
      for (const card of cards) {
        await tx.insert('delivery', {
          order_id: orderId,
          order_no: order.order_no,
          card_id: card.id,
          card_code: card.card_code,
          card_secret: card.card_secret,
          delivery_type: 2, // 手动发货
          operator_id: operatorId,
        });
      }
      
      // 更新订单状态
      await tx.update('order_main', {
        order_status: OrderStatus.COMPLETED,
        delivery_status: DeliveryStatus.DELIVERED,
        delivery_time: new Date(),
        admin_remark: `管理员手动发货`,
      }, { id: orderId });
      
      // 更新商品销量
      await tx.query(
        'UPDATE product SET sold_count = sold_count + ?, stock_count = stock_count - ? WHERE id = ?',
        [order.quantity, order.quantity, order.product_id]
      );
      
      // 记录操作日志
      await logger.logOperation(operatorId, 'MANUAL_DELIVERY', 'order', orderId, {
        order_no: order.order_no,
        card_count: cards.length,
      }, null);
      
      return { success: true, cards };
    });
  }
  
  /**
   * 取消订单
   */
  async cancelOrder(orderId, reason, operatorId = null) {
    const order = await db.queryOne('SELECT * FROM order_main WHERE id = ?', [orderId]);
    
    if (!order) {
      throw new BusinessError(ErrorCodes.ORDER_NOT_FOUND);
    }
    
    if (order.order_status !== OrderStatus.PENDING && order.order_status !== OrderStatus.PAYING) {
      throw new BusinessError({
        code: 5040,
        message: '当前订单状态不支持取消',
      });
    }
    
    await db.update('order_main', {
      order_status: OrderStatus.CANCELLED,
      closed_at: new Date(),
      admin_remark: reason || '订单取消',
    }, { id: orderId });
    
    if (operatorId) {
      await logger.logOperation(operatorId, 'ORDER_CANCEL', 'order', orderId, {
        order_no: order.order_no,
        reason,
      }, null);
    }
    
    return true;
  }
  
  /**
   * 处理过期订单
   */
  async handleExpiredOrders() {
    const expiredOrders = await db.query(`
      SELECT id, order_no FROM order_main 
      WHERE order_status IN (0, 1) 
      AND expire_time < NOW()
    `);
    
    let count = 0;
    for (const order of expiredOrders) {
      try {
        await this.cancelOrder(order.id, '订单超时自动取消');
        count++;
      } catch (error) {
        logger.error(`取消过期订单失败: ${order.order_no}`, error);
      }
    }
    
    if (count > 0) {
      logger.info(`已取消 ${count} 个过期订单`);
    }
    
    return count;
  }
  
  /**
   * 获取订单统计
   */
  async getOrderStats(startDate, endDate) {
    const sql = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN order_status = 3 THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN order_status = 3 THEN total_amount ELSE 0 END) as total_amount,
        SUM(CASE WHEN order_status = 3 THEN quantity ELSE 0 END) as total_quantity
      FROM order_main
      WHERE created_at >= ? AND created_at <= ?
    `;
    
    return await db.queryOne(sql, [startDate, endDate + ' 23:59:59']);
  }
}

// 导出订单状态枚举
module.exports = new OrderService();
module.exports.OrderStatus = OrderStatus;
module.exports.DeliveryStatus = DeliveryStatus;
