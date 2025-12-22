/**
 * 支付服务层
 * 支付宝沙箱支付集成
 */

const AlipaySdk = require('alipay-sdk').default;
const db = require('../utils/database');
const redis = require('../utils/redis');
const logger = require('../utils/logger');
const config = require('../config');
const orderService = require('./orderService');
const { BusinessError } = require('../middlewares/errorHandler');
const { ErrorCodes } = require('../utils/response');

// 支付状态
const PayStatus = {
  PENDING: 0,     // 待支付
  SUCCESS: 1,     // 支付成功
  FAILED: 2,      // 支付失败
  REFUNDED: 3,    // 已退款
};

class PaymentService {
  constructor() {
    this.alipaySdk = null;
    this.initAlipay();
  }
  
  /**
   * 初始化支付宝 SDK
   */
  initAlipay() {
    if (!config.alipay.appId || !config.alipay.privateKey) {
      logger.warn('支付宝配置不完整，支付功能将不可用');
      return;
    }
    
    try {
      this.alipaySdk = new AlipaySdk({
        appId: config.alipay.appId,
        privateKey: config.alipay.privateKey,
        alipayPublicKey: config.alipay.alipayPublicKey,
        gateway: config.alipay.gateway,
        signType: config.alipay.signType,
      });
      logger.info('支付宝 SDK 初始化成功');
    } catch (error) {
      logger.error('支付宝 SDK 初始化失败:', error);
    }
  }
  
  /**
   * 创建支付订单
   */
  async createPayment(orderId, payChannel = 'alipay') {
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      throw new BusinessError(ErrorCodes.ORDER_NOT_FOUND);
    }
    
    // 检查订单状态
    if (order.order_status !== 0 && order.order_status !== 1) {
      throw new BusinessError({
        code: 6010,
        message: '当前订单状态不支持支付',
      });
    }
    
    // 检查是否过期
    if (new Date(order.expire_time) < new Date()) {
      throw new BusinessError(ErrorCodes.ORDER_EXPIRED);
    }
    
    // 生成支付流水号
    const payNo = `PAY${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // 创建支付记录
    const paymentData = {
      order_id: orderId,
      order_no: order.order_no,
      pay_no: payNo,
      pay_channel: payChannel,
      pay_status: PayStatus.PENDING,
      request_amount: order.total_amount,
      currency: order.currency,
      expired_at: order.expire_time,
    };
    
    const result = await db.insert('payment', paymentData);
    const paymentId = result.insertId;
    
    // 更新订单状态为支付中
    await orderService.updateOrderStatus(orderId, 1, { pay_channel: payChannel });
    
    // 根据支付渠道生成支付信息
    let paymentInfo = {};
    
    if (payChannel === 'alipay') {
      paymentInfo = await this.createAlipayPayment(order, payNo);
      
      // 更新支付链接
      await db.update('payment', { pay_url: paymentInfo.payUrl }, { id: paymentId });
    }
    
    return {
      payment_id: paymentId,
      pay_no: payNo,
      ...paymentInfo,
    };
  }
  
  /**
   * 创建支付宝支付
   */
  async createAlipayPayment(order, payNo) {
    if (!this.alipaySdk) {
      throw new BusinessError({
        code: 6020,
        message: '支付宝支付暂不可用',
      });
    }
    
    try {
      // 构建支付参数
      const bizContent = {
        out_trade_no: payNo,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        total_amount: order.total_amount.toString(),
        subject: order.product_name,
        body: `购买 ${order.product_name} x ${order.quantity}`,
      };
      
      // 生成支付页面 URL (网页支付)
      const result = this.alipaySdk.pageExec('alipay.trade.page.pay', {
        method: 'GET',
        bizContent,
        returnUrl: config.alipay.returnUrl,
        notifyUrl: config.alipay.notifyUrl,
      });
      
      logger.info(`支付宝订单创建成功: ${payNo}`);
      
      return {
        payUrl: result,
        payType: 'redirect', // 跳转支付
      };
      
    } catch (error) {
      logger.error('创建支付宝订单失败:', error);
      throw new BusinessError(ErrorCodes.PAYMENT_FAILED);
    }
  }
  
  /**
   * 处理支付宝异步通知
   */
  async handleAlipayNotify(params) {
    logger.info('收到支付宝回调:', params);
    
    // 验证签名
    if (!this.verifyAlipaySign(params)) {
      logger.error('支付宝签名验证失败');
      throw new BusinessError(ErrorCodes.PAYMENT_SIGN_ERROR);
    }
    
    const {
      out_trade_no: payNo,
      trade_no: platformTradeNo,
      trade_status: tradeStatus,
      total_amount: totalAmount,
      buyer_id: buyerId,
    } = params;
    
    // 查询支付记录
    const payment = await db.queryOne(
      'SELECT * FROM payment WHERE pay_no = ?',
      [payNo],
    );
    
    if (!payment) {
      logger.error(`支付记录不存在: ${payNo}`);
      throw new BusinessError({
        code: 6030,
        message: '支付记录不存在',
      });
    }
    
    // 幂等检查
    const processKey = `payment:notify:${payNo}`;
    const isProcessing = await redis.get(processKey);
    
    if (isProcessing || payment.pay_status === PayStatus.SUCCESS) {
      logger.info(`支付回调已处理，跳过: ${payNo}`);
      return { success: true, message: 'already processed' };
    }
    
    // 设置处理锁（防止并发）
    await redis.set(processKey, '1', 60);
    
    try {
      // 验证金额
      if (parseFloat(totalAmount) !== parseFloat(payment.request_amount)) {
        logger.error(`支付金额不匹配: 期望 ${payment.request_amount}, 实际 ${totalAmount}`);
        throw new BusinessError(ErrorCodes.PAYMENT_AMOUNT_ERROR);
      }
      
      // 支付成功
      if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
        return await this.processPaymentSuccess(payment, {
          platformTradeNo,
          paidAmount: totalAmount,
          buyerId,
          rawData: JSON.stringify(params),
        });
      }
      
      // 支付失败或其他状态
      await db.update('payment', {
        pay_status: PayStatus.FAILED,
        platform_trade_no: platformTradeNo,
        notify_status: 1,
        notify_time: new Date(),
        notify_count: payment.notify_count + 1,
        notify_raw: JSON.stringify(params),
        error_msg: `交易状态: ${tradeStatus}`,
      }, { id: payment.id });
      
      return { success: false, message: tradeStatus };
      
    } finally {
      // 释放锁
      await redis.del(processKey);
    }
  }
  
  /**
   * 处理支付成功
   */
  async processPaymentSuccess(payment, data) {
    const { platformTradeNo, paidAmount, buyerId, rawData } = data;
    
    // 使用事务处理
    return await db.transaction(async (tx) => {
      // 更新支付记录
      await tx.update('payment', {
        pay_status: PayStatus.SUCCESS,
        paid_amount: paidAmount,
        platform_trade_no: platformTradeNo,
        platform_buyer_id: buyerId,
        notify_status: 1,
        notify_time: new Date(),
        notify_count: payment.notify_count + 1,
        notify_raw: rawData,
      }, { id: payment.id });
      
      // 处理订单发货
      const deliveryResult = await orderService.handlePaymentSuccess(payment.order_id, {
        paid_amount: paidAmount,
        pay_channel: payment.pay_channel,
        pay_time: new Date(),
      }, tx);
      
      logger.info(`支付处理完成: ${payment.pay_no}`, deliveryResult);
      
      return { success: true, delivery: deliveryResult };
    });
  }
  
  /**
   * 验证支付宝签名
   */
  verifyAlipaySign(params) {
    if (!this.alipaySdk) {
      return false;
    }
    
    try {
      // 提取签名参数
      const sign = params.sign;
      const signType = params.sign_type;
      
      // 移除签名相关字段
      const verifyParams = { ...params };
      delete verifyParams.sign;
      delete verifyParams.sign_type;
      
      // 按字母序排列并拼接
      const sortedKeys = Object.keys(verifyParams).sort();
      const signStr = sortedKeys
        .filter(key => verifyParams[key] !== '' && verifyParams[key] !== undefined)
        .map(key => `${key}=${verifyParams[key]}`)
        .join('&');
      
      // 验证签名
      return this.alipaySdk.checkResponseSign(signStr, sign, signType);
    } catch (error) {
      logger.error('验签失败:', error);
      return false;
    }
  }
  
  /**
   * 处理支付宝同步回调
   */
  async handleAlipayReturn(params) {
    const { out_trade_no: payNo } = params;
    
    // 查询支付记录
    const payment = await db.queryOne(
      'SELECT p.*, o.order_no FROM payment p JOIN order_main o ON p.order_id = o.id WHERE p.pay_no = ?',
      [payNo],
    );
    
    if (!payment) {
      return { success: false, message: '支付记录不存在' };
    }
    
    return {
      success: payment.pay_status === PayStatus.SUCCESS,
      order_no: payment.order_no,
      pay_status: payment.pay_status,
    };
  }
  
  /**
   * 查询支付状态
   */
  async queryPaymentStatus(payNo) {
    const payment = await db.queryOne(
      `SELECT p.*, o.order_no, o.order_status, o.product_name 
       FROM payment p 
       JOIN order_main o ON p.order_id = o.id 
       WHERE p.pay_no = ?`,
      [payNo],
    );
    
    return payment;
  }
  
  /**
   * 获取订单的支付记录
   */
  async getPaymentsByOrderId(orderId) {
    return await db.query(
      'SELECT * FROM payment WHERE order_id = ? ORDER BY id DESC',
      [orderId],
    );
  }
  
  /**
   * 获取支付记录列表（后台）
   */
  async getPaymentList(params = {}) {
    const { page = 1, limit = 20, pay_no, order_no, status, channel, start_date, end_date } = params;
    
    let sql = `
      SELECT p.*, o.product_name, o.quantity
      FROM payment p
      LEFT JOIN order_main o ON p.order_id = o.id
      WHERE 1=1
    `;
    const sqlParams = [];
    
    if (pay_no) {
      sql += ' AND p.pay_no = ?';
      sqlParams.push(pay_no);
    }
    
    if (order_no) {
      sql += ' AND p.order_no = ?';
      sqlParams.push(order_no);
    }
    
    if (status !== undefined) {
      sql += ' AND p.pay_status = ?';
      sqlParams.push(status);
    }
    
    if (channel) {
      sql += ' AND p.pay_channel = ?';
      sqlParams.push(channel);
    }
    
    if (start_date) {
      sql += ' AND p.created_at >= ?';
      sqlParams.push(start_date);
    }
    
    if (end_date) {
      sql += ' AND p.created_at <= ?';
      sqlParams.push(end_date + ' 23:59:59');
    }
    
    sql += ' ORDER BY p.id DESC';
    
    return await db.paginate(sql, sqlParams, page, limit);
  }
  
  /**
   * 手动确认支付（管理员操作）
   */
  async manualConfirmPayment(orderId, operatorId, remark = '') {
    const order = await orderService.getOrderById(orderId);
    
    if (!order) {
      throw new BusinessError(ErrorCodes.ORDER_NOT_FOUND);
    }
    
    if (order.order_status !== 0 && order.order_status !== 1 && order.order_status !== 4) {
      throw new BusinessError({
        code: 6040,
        message: '当前订单状态不支持手动确认支付',
      });
    }
    
    // 创建手动支付记录
    const payNo = `MANUAL${Date.now()}`;
    await db.insert('payment', {
      order_id: orderId,
      order_no: order.order_no,
      pay_no: payNo,
      pay_channel: 'manual',
      pay_status: PayStatus.SUCCESS,
      request_amount: order.total_amount,
      paid_amount: order.total_amount,
      notify_status: 1,
      notify_time: new Date(),
    });
    
    // 处理订单发货
    return await db.transaction(async (tx) => {
      const result = await orderService.handlePaymentSuccess(orderId, {
        paid_amount: order.total_amount,
        pay_channel: 'manual',
        pay_time: new Date(),
      }, tx);
      
      // 记录操作日志
      await logger.logOperation(operatorId, 'MANUAL_CONFIRM_PAY', 'order', orderId, {
        order_no: order.order_no,
        amount: order.total_amount,
        remark,
      }, null);
      
      return result;
    });
  }
}

module.exports = new PaymentService();
module.exports.PayStatus = PayStatus;
