/**
 * 订单 API 路由
 */

const express = require('express');
const router = express.Router();
const orderService = require('../../services/orderService');
const cardService = require('../../services/cardService');
const paymentService = require('../../services/paymentService');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { success, fail, paginated, ErrorCodes } = require('../../utils/response');
const { requireAdminAuth } = require('../../middlewares/auth');
const { validators } = require('../../middlewares/validator');
const { orderRateLimiter } = require('../../middlewares/rateLimiter');
const { parsePagination } = require('../../utils/helpers');

/**
 * 创建订单（买家）
 * POST /api/orders
 */
router.post('/', orderRateLimiter, validators.createOrder, asyncHandler(async (req, res) => {
  const { product_id, quantity, email, phone } = req.body;
  
  try {
    const order = await orderService.createOrder({
      product_id,
      quantity,
      email,
      phone,
    }, req);
    
    success(res, { order }, '订单创建成功');
  } catch (error) {
    fail(res, error);
  }
}));

/**
 * 查询订单（买家）
 * GET /api/orders/query
 */
router.get('/query', asyncHandler(async (req, res) => {
  const { order_no, email } = req.query;
  
  try {
    const orders = await orderService.queryOrders({ order_no, email });
    success(res, { orders });
  } catch (error) {
    fail(res, error);
  }
}));

/**
 * 获取订单详情（买家）
 * GET /api/orders/:orderNo
 */
router.get('/:orderNo', asyncHandler(async (req, res) => {
  const { orderNo } = req.params;
  
  try {
    const order = await orderService.getOrderDetail(orderNo);
    success(res, { order });
  } catch (error) {
    fail(res, error);
  }
}));

/**
 * 创建支付
 * POST /api/orders/:orderNo/pay
 */
router.post('/:orderNo/pay', asyncHandler(async (req, res) => {
  const { orderNo } = req.params;
  const { pay_channel = 'alipay' } = req.body;
  
  const order = await orderService.getOrderByNo(orderNo);
  
  if (!order) {
    return fail(res, ErrorCodes.ORDER_NOT_FOUND);
  }
  
  try {
    const payment = await paymentService.createPayment(order.id, pay_channel);
    success(res, { payment });
  } catch (error) {
    fail(res, error);
  }
}));

/**
 * 查询支付状态
 * GET /api/orders/:orderNo/payment-status
 */
router.get('/:orderNo/payment-status', asyncHandler(async (req, res) => {
  const { orderNo } = req.params;
  
  const order = await orderService.getOrderByNo(orderNo);
  
  if (!order) {
    return fail(res, ErrorCodes.ORDER_NOT_FOUND);
  }
  
  success(res, {
    order_status: order.order_status,
    delivery_status: order.delivery_status,
    pay_time: order.pay_time,
  });
}));

// ========== 以下需要管理员权限 ==========

/**
 * 获取订单列表（后台）
 * GET /api/orders/admin/list
 */
router.get('/admin/list', requireAdminAuth, asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { order_no, email, status, product_id, start_date, end_date } = req.query;
  
  const result = await orderService.getOrderList({
    page,
    limit,
    order_no,
    email,
    status: status !== undefined ? parseInt(status) : undefined,
    product_id,
    start_date,
    end_date,
  });
  
  paginated(res, result);
}));

/**
 * 获取订单详情（后台）
 * GET /api/orders/admin/:id
 */
router.get('/admin/:id', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await orderService.getOrderById(id);
  
  if (!order) {
    return fail(res, ErrorCodes.ORDER_NOT_FOUND);
  }
  
  // 获取卡密
  if (order.order_status === 3) {
    order.cards = await cardService.getCardsByOrderId(order.id);
  }
  
  // 获取支付记录
  order.payments = await paymentService.getPaymentsByOrderId(order.id);
  
  success(res, { order });
}));

/**
 * 手动发货
 * POST /api/orders/admin/:id/deliver
 */
router.post('/admin/:id/deliver', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await orderService.manualDelivery(id, req.session.user.id);
    success(res, result, '发货成功');
  } catch (error) {
    fail(res, error);
  }
}));

/**
 * 手动确认支付
 * POST /api/orders/admin/:id/confirm-payment
 */
router.post('/admin/:id/confirm-payment', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remark } = req.body;
  
  try {
    const result = await paymentService.manualConfirmPayment(id, req.session.user.id, remark);
    success(res, result, '支付确认成功');
  } catch (error) {
    fail(res, error);
  }
}));

/**
 * 取消订单
 * POST /api/orders/admin/:id/cancel
 */
router.post('/admin/:id/cancel', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  try {
    await orderService.cancelOrder(id, reason, req.session.user.id);
    success(res, null, '订单已取消');
  } catch (error) {
    fail(res, error);
  }
}));

/**
 * 添加备注
 * POST /api/orders/admin/:id/remark
 */
router.post('/admin/:id/remark', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remark } = req.body;
  
  const db = require('../../utils/database');
  await db.update('order_main', { admin_remark: remark }, { id });
  
  success(res, null, '备注已保存');
}));

/**
 * 处理过期订单
 * POST /api/orders/admin/handle-expired
 */
router.post('/admin/handle-expired', requireAdminAuth, asyncHandler(async (req, res) => {
  const count = await orderService.handleExpiredOrders();
  success(res, { count }, `已处理 ${count} 个过期订单`);
}));

/**
 * 导出订单
 * GET /api/orders/admin/export
 */
router.get('/admin/export', requireAdminAuth, asyncHandler(async (req, res) => {
  const { start_date, end_date, status } = req.query;
  
  const db = require('../../utils/database');
  
  let sql = `
    SELECT o.order_no, o.product_name, o.quantity, o.unit_price, o.total_amount,
           o.paid_amount, o.buyer_email, o.order_status, o.pay_channel,
           o.pay_time, o.created_at
    FROM order_main o
    WHERE 1=1
  `;
  const params = [];
  
  if (start_date) {
    sql += ' AND o.created_at >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    sql += ' AND o.created_at <= ?';
    params.push(end_date + ' 23:59:59');
  }
  
  if (status !== undefined) {
    sql += ' AND o.order_status = ?';
    params.push(parseInt(status));
  }
  
  sql += ' ORDER BY o.id DESC LIMIT 10000';
  
  const orders = await db.query(sql, params);
  
  // 生成 CSV
  const statusMap = {
    0: '待支付', 1: '支付中', 2: '已支付待发货', 3: '已完成',
    4: '待人工处理', 5: '已取消', 6: '已退款',
  };
  
  let csv = '\uFEFF订单号,商品,数量,单价,总金额,实付金额,邮箱,状态,支付渠道,支付时间,下单时间\n';
  
  orders.forEach(o => {
    csv += `${o.order_no},${o.product_name},${o.quantity},${o.unit_price},${o.total_amount},`;
    csv += `${o.paid_amount || ''},${o.buyer_email || ''},${statusMap[o.order_status]},`;
    csv += `${o.pay_channel || ''},${o.pay_time || ''},${o.created_at}\n`;
  });
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="orders_${Date.now()}.csv"`);
  res.send(csv);
}));

module.exports = router;
