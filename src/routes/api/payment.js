/**
 * 支付 API 路由
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../../services/paymentService');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { success, fail, paginated } = require('../../utils/response');
const { requireAdminAuth } = require('../../middlewares/auth');
const { parsePagination } = require('../../utils/helpers');
const logger = require('../../utils/logger');

/**
 * 支付宝异步通知
 * POST /api/payment/notify/alipay
 */
router.post('/notify/alipay', asyncHandler(async (req, res) => {
  logger.info('支付宝回调请求:', req.body);
  
  try {
    await paymentService.handleAlipayNotify(req.body);
    
    // 返回 success 给支付宝
    res.send('success');
  } catch (error) {
    logger.error('支付宝回调处理失败:', error);
    res.send('fail');
  }
}));

/**
 * 支付宝同步回调
 * GET /api/payment/return/alipay
 */
router.get('/return/alipay', asyncHandler(async (req, res) => {
  logger.info('支付宝同步回调:', req.query);
  
  const result = await paymentService.handleAlipayReturn(req.query);
  
  // 重定向到订单结果页
  if (result.order_no) {
    res.redirect(`/order/${result.order_no}`);
  } else {
    res.redirect('/order/query');
  }
}));

/**
 * 查询支付状态
 * GET /api/payment/status/:payNo
 */
router.get('/status/:payNo', asyncHandler(async (req, res) => {
  const { payNo } = req.params;
  
  const payment = await paymentService.queryPaymentStatus(payNo);
  
  if (!payment) {
    return fail(res, { code: 6030, message: '支付记录不存在' });
  }
  
  success(res, {
    pay_status: payment.pay_status,
    order_status: payment.order_status,
    order_no: payment.order_no,
  });
}));

// ========== 以下需要管理员权限 ==========

/**
 * 获取支付记录列表
 * GET /api/payment/admin/list
 */
router.get('/admin/list', requireAdminAuth, asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { pay_no, order_no, status, channel, start_date, end_date } = req.query;
  
  const result = await paymentService.getPaymentList({
    page,
    limit,
    pay_no,
    order_no,
    status: status !== undefined ? parseInt(status) : undefined,
    channel,
    start_date,
    end_date,
  });
  
  paginated(res, result);
}));

/**
 * 获取支付记录详情
 * GET /api/payment/admin/:id
 */
router.get('/admin/:id', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const db = require('../../utils/database');
  const payment = await db.queryOne(
    `SELECT p.*, o.product_name, o.quantity, o.buyer_email
     FROM payment p
     LEFT JOIN order_main o ON p.order_id = o.id
     WHERE p.id = ?`,
    [id],
  );
  
  if (!payment) {
    return fail(res, { code: 6030, message: '支付记录不存在' });
  }
  
  success(res, { payment });
}));

module.exports = router;
