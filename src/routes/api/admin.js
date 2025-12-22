/**
 * 管理后台 API 路由
 * 处理所有 /api/admin/* 请求
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const productService = require('../../services/productService');
const cardService = require('../../services/cardService');
const orderService = require('../../services/orderService');
const statisticsService = require('../../services/statisticsService');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { requireAdminAuth } = require('../../middlewares/auth');
const { success, fail, paginated } = require('../../utils/response');
const { parsePagination } = require('../../utils/helpers');
const config = require('../../config');
const redis = require('../../utils/redis');
const logger = require('../../utils/logger');

// 所有 admin API 都需要登录验证
router.use(requireAdminAuth);

// ========== 图片上传配置 ==========
const uploadDir = path.join(__dirname, '../../../public/uploads/products');

// 确保上传目录存在
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created upload directory:', uploadDir);
  }
} catch (err) {
  console.error('Failed to create upload directory:', err);
}

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Upload destination:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log('Upload filename:', filename);
    cb(null, filename);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只支持 jpg, png, gif, webp 图片格式'));
    }
  }
});

// 卡密文件上传配置
const cardUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 .txt 或 .csv 文件'));
    }
  }
});

// ========== 商品管理 ==========

/**
 * 创建商品
 * POST /api/admin/products
 */
router.post('/products', (req, res, next) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer 错误
      console.error('Multer error:', err);
      return res.status(400).json({ code: 1, message: '文件上传失败: ' + err.message });
    } else if (err) {
      // 其他错误
      console.error('Upload error:', err);
      return res.status(400).json({ code: 1, message: err.message });
    }
    next();
  });
}, asyncHandler(async (req, res) => {
  console.log('Creating product, body:', req.body);
  console.log('Uploaded file:', req.file);
  
  const data = { ...req.body };
  
  // 处理上传的图片
  if (req.file) {
    data.image = '/uploads/products/' + req.file.filename;
  }
  
  const result = await productService.createProduct(data, req.session.user.id);
  success(res, result, '商品创建成功');
}));

/**
 * 更新商品
 * PUT /api/admin/products/:id
 */
router.put('/products/:id', (req, res, next) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ code: 1, message: '文件上传失败: ' + err.message });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ code: 1, message: err.message });
    }
    next();
  });
}, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };
  
  // 处理上传的图片
  if (req.file) {
    data.image = '/uploads/products/' + req.file.filename;
  }
  
  await productService.updateProduct(id, data, req.session.user.id);
  success(res, null, '商品更新成功');
}));

/**
 * 删除商品
 * DELETE /api/admin/products/:id
 */
router.delete('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await productService.deleteProduct(id);
  success(res, null, '商品已删除');
}));

/**
 * 更新商品状态
 * PATCH /api/admin/products/:id/status
 */
router.patch('/products/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  await productService.updateProduct(id, { status }, req.session.user.id);
  success(res, null, status === 1 ? '商品已上架' : '商品已下架');
}));

/**
 * 同步商品库存
 * POST /api/admin/products/sync-stock
 */
router.post('/products/sync-stock', asyncHandler(async (req, res) => {
  await productService.syncAllProductStock();
  success(res, null, '库存同步完成');
}));

// ========== 分类管理 ==========

/**
 * 创建分类
 * POST /api/admin/categories
 */
router.post('/categories', asyncHandler(async (req, res) => {
  const result = await productService.createCategory(req.body);
  success(res, result, '分类创建成功');
}));

/**
 * 获取分类详情
 * GET /api/admin/categories/:id
 */
router.get('/categories/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await productService.getCategoryById(id);
  if (!category) {
    return fail(res, '分类不存在', 404);
  }
  success(res, { category });
}));

/**
 * 更新分类
 * PUT /api/admin/categories/:id
 */
router.put('/categories/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await productService.updateCategory(id, req.body);
  success(res, null, '分类更新成功');
}));

/**
 * 删除分类
 * DELETE /api/admin/categories/:id
 */
router.delete('/categories/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await productService.deleteCategory(id);
  success(res, null, '分类已删除');
}));

// ========== 卡密管理 ==========

/**
 * 导入卡密
 * POST /api/admin/cards/import
 */
router.post('/cards/import', (req, res, next) => {
  cardUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ code: 1, message: '文件上传失败: ' + err.message });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ code: 1, message: err.message });
    }
    next();
  });
}, asyncHandler(async (req, res) => {
  // 支持两种字段名：product_id 和 productId
  const productId = req.body.product_id || req.body.productId;
  const cardsText = req.body.cards_text || req.body.cardsText;
  const skipDuplicate = req.body.skip_duplicate || req.body.skipDuplicate;
  
  console.log('Card import request:', { productId, hasFile: !!req.file, hasText: !!cardsText });
  
  let lines = [];
  
  // 支持两种导入方式：文件上传或文本输入
  if (req.file) {
    // 文件上传方式
    const content = req.file.buffer.toString('utf8');
    lines = content.split(/\r?\n/).filter(line => line.trim());
    console.log('File content lines:', lines.length);
  } else if (cardsText) {
    // 文本输入方式
    lines = cardsText.split(/\r?\n/).filter(line => line.trim());
    console.log('Text input lines:', lines.length);
  } else {
    return fail(res, { code: 1001, message: '请上传卡密文件或输入卡密内容' });
  }
  
  if (lines.length === 0) {
    return fail(res, { code: 1001, message: '卡密内容为空' });
  }
  
  if (!productId) {
    return fail(res, { code: 1001, message: '请选择商品' });
  }
  
  // 解析卡密（支持多种格式：纯卡密、卡密,卡密密钥）
  const cards = lines.map(line => {
    const parts = line.split(/[,\t|]/).map(p => p.trim());
    return {
      code: parts[0],
      secret: parts[1] || null,
    };
  }).filter(card => card.code);
  
  // 导入卡密
  const result = await cardService.importCards(
    parseInt(productId),
    cards,
    req.session.user.id,
    req.file?.originalname || '手动输入'
  );
  
  success(res, result, `成功导入 ${result.imported} 张卡密`);
}));

/**
 * 作废卡密
 * POST /api/admin/cards/:id/void
 */
router.post('/cards/:id/void', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  await cardService.voidCard(id, reason || '管理员作废', req.session.user.id);
  success(res, null, '卡密已作废');
}));

/**
 * 批量作废卡密
 * POST /api/admin/cards/batch-void
 */
router.post('/cards/batch-void', asyncHandler(async (req, res) => {
  const { ids, reason } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return fail(res, '请选择要作废的卡密');
  }
  
  const result = await cardService.voidCards(ids, reason || '批量作废', req.session.user.id);
  success(res, result, `成功作废 ${result.count} 张卡密`);
}));

/**
 * 恢复作废的卡密
 * POST /api/admin/cards/:id/restore
 */
router.post('/cards/:id/restore', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await cardService.restoreCard(id, req.session.user.id);
  success(res, null, '卡密已恢复');
}));

/**
 * 批量恢复作废的卡密
 * POST /api/admin/cards/batch-restore
 */
router.post('/cards/batch-restore', asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return fail(res, '请选择要恢复的卡密');
  }
  
  const result = await cardService.restoreCards(ids, req.session.user.id);
  success(res, result, `成功恢复 ${result.count} 张卡密`);
}));

/**
 * 删除卡密
 * DELETE /api/admin/cards/:id
 */
router.delete('/cards/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await cardService.deleteCard(id, req.session.user.id);
  success(res, null, '卡密已删除');
}));

/**
 * 批量删除卡密
 * POST /api/admin/cards/batch-delete
 */
router.post('/cards/batch-delete', asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return fail(res, '请选择要删除的卡密');
  }
  
  const result = await cardService.deleteCards(ids, req.session.user.id);
  success(res, result, `成功删除 ${result.count} 张卡密`);
}));

/**
 * 导出卡密
 * GET /api/admin/cards/export
 */
router.get('/cards/export', asyncHandler(async (req, res) => {
  const params = {
    productId: req.query.productId,
    status: req.query.status,
  };
  
  const cards = await cardService.exportCards(params);
  
  // 生成 CSV 内容
  let csv = '\uFEFF'; // UTF-8 BOM
  csv += '卡号,卡密,商品,状态,导入时间\n';
  
  cards.forEach(card => {
    csv += `"${card.card_no}","${card.card_secret}","${card.product_name}","${card.status_text}","${card.created_at}"\n`;
  });
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=cards_' + Date.now() + '.csv');
  res.send(csv);
}));

// ========== 订单管理 ==========

/**
 * 取消订单
 * POST /api/admin/orders/:id/cancel
 */
router.post('/orders/:id/cancel', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  await orderService.cancelOrder(id, req.session.user.id, reason);
  success(res, null, '订单已取消');
}));

/**
 * 订单退款
 * POST /api/admin/orders/:id/refund
 */
router.post('/orders/:id/refund', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  
  await orderService.refundOrder(id, amount, reason, req.session.user.id);
  success(res, null, '退款成功');
}));

/**
 * 添加订单备注
 * POST /api/admin/orders/:id/remark
 */
router.post('/orders/:id/remark', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remark } = req.body;
  
  await orderService.addRemark(id, remark, req.session.user.id);
  success(res, null, '备注已添加');
}));

/**
 * 手动发货
 * POST /api/admin/orders/:id/deliver
 */
router.post('/orders/:id/deliver', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await orderService.manualDeliver(id, req.session.user.id);
  success(res, null, '发货成功');
}));

/**
 * 确认收款
 * POST /api/admin/orders/:id/confirm-payment
 */
router.post('/orders/:id/confirm-payment', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await orderService.confirmPayment(id, req.session.user.id);
  success(res, null, '已确认收款');
}));

/**
 * 导出订单
 * GET /api/admin/orders/export
 */
router.get('/orders/export', asyncHandler(async (req, res) => {
  const params = {
    status: req.query.status,
    productId: req.query.productId,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    keyword: req.query.keyword,
  };
  
  const orders = await orderService.exportOrders(params);
  
  // 生成 CSV 内容
  let csv = '\uFEFF'; // UTF-8 BOM
  csv += '订单号,商品名称,数量,金额,状态,联系方式,支付方式,创建时间,支付时间\n';
  
  orders.forEach(order => {
    csv += `"${order.order_no}","${order.product_name}","${order.quantity}","${order.total_amount}","${order.status_text}","${order.contact}","${order.pay_method}","${order.created_at}","${order.paid_at || ''}"\n`;
  });
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=orders_' + Date.now() + '.csv');
  res.send(csv);
}));

// ========== 统计数据 ==========

/**
 * 获取统计概览
 * GET /api/admin/statistics/summary
 */
router.get('/statistics/summary', asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  
  // 获取日期范围
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  
  // 获取当前周期数据
  const db = require('../../utils/database');
  const currentStats = await db.queryOne(`
    SELECT 
      COALESCE(SUM(CASE WHEN order_status = 3 THEN paid_amount ELSE 0 END), 0) as sales,
      COUNT(CASE WHEN order_status = 3 THEN 1 END) as orders,
      COALESCE(SUM(CASE WHEN order_status = 3 THEN quantity ELSE 0 END), 0) as cards
    FROM order_main
    WHERE created_at >= ? AND created_at <= ?
  `, [startStr + ' 00:00:00', endStr + ' 23:59:59']);
  
  // 获取上一周期数据进行对比
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);
  const prevStartStr = prevStartDate.toISOString().split('T')[0];
  
  const prevStats = await db.queryOne(`
    SELECT 
      COALESCE(SUM(CASE WHEN order_status = 3 THEN paid_amount ELSE 0 END), 0) as sales,
      COUNT(CASE WHEN order_status = 3 THEN 1 END) as orders,
      COALESCE(SUM(CASE WHEN order_status = 3 THEN quantity ELSE 0 END), 0) as cards
    FROM order_main
    WHERE created_at >= ? AND created_at < ?
  `, [prevStartStr + ' 00:00:00', startStr + ' 00:00:00']);
  
  // 计算环比变化
  const calcChange = (current, prev) => {
    if (!prev || prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / prev) * 100);
  };
  
  const avgOrder = currentStats.orders > 0 ? currentStats.sales / currentStats.orders : 0;
  const prevAvgOrder = prevStats.orders > 0 ? prevStats.sales / prevStats.orders : 0;
  
  // 获取支付渠道统计
  const channels = await db.query(`
    SELECT 
      COALESCE(pay_channel, 'unknown') as name,
      COUNT(*) as value
    FROM order_main
    WHERE order_status = 3 
    AND created_at >= ? AND created_at <= ?
    GROUP BY pay_channel
  `, [startStr + ' 00:00:00', endStr + ' 23:59:59']);
  
  // 获取订单状态分布
  const statusStats = await db.query(`
    SELECT 
      order_status,
      COUNT(*) as count
    FROM order_main
    WHERE created_at >= ? AND created_at <= ?
    GROUP BY order_status
  `, [startStr + ' 00:00:00', endStr + ' 23:59:59']);
  
  // 转换为状态分布对象
  const statusDist = {};
  const statusNameMap = {
    0: 'pending',
    1: 'paying',
    2: 'paid',
    3: 'delivered',
    4: 'manual',
    5: 'cancelled',
    6: 'refunded',
  };
  statusStats.forEach(s => {
    const name = statusNameMap[s.order_status] || 'unknown';
    statusDist[name] = parseInt(s.count) || 0;
  });
  
  success(res, {
    sales: parseFloat(currentStats.sales) || 0,
    orders: parseInt(currentStats.orders) || 0,
    cards: parseInt(currentStats.cards) || 0,
    avgOrder: avgOrder,
    salesChange: calcChange(currentStats.sales, prevStats.sales),
    ordersChange: calcChange(currentStats.orders, prevStats.orders),
    cardsChange: calcChange(currentStats.cards, prevStats.cards),
    avgChange: calcChange(avgOrder, prevAvgOrder),
    channels: channels,
    statusDist: statusDist,
  });
}));

/**
 * 获取趋势数据
 * GET /api/admin/statistics/trend
 */
router.get('/statistics/trend', asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const db = require('../../utils/database');
  
  const trend = await db.query(`
    SELECT 
      DATE(created_at) as date,
      COALESCE(SUM(CASE WHEN order_status = 3 THEN paid_amount ELSE 0 END), 0) as amount,
      COUNT(CASE WHEN order_status = 3 THEN 1 END) as count
    FROM order_main
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [days]);
  
  // 填充缺失的日期
  const result = [];
  const dateMap = new Map(trend.map(t => {
    // 处理日期格式，可能是 Date 对象或字符串
    let dateStr;
    if (t.date instanceof Date) {
      dateStr = t.date.toISOString().split('T')[0];
    } else if (typeof t.date === 'string') {
      dateStr = t.date.split('T')[0].split(' ')[0];
    } else {
      dateStr = String(t.date);
    }
    return [dateStr, t];
  }));
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const data = dateMap.get(dateStr);
    result.push({
      date: dateStr,
      amount: data ? parseFloat(data.amount) || 0 : 0,
      count: data ? parseInt(data.count) || 0 : 0,
    });
  }
  
  success(res, result);
}));

/**
 * 获取商品统计
 * GET /api/admin/statistics/products
 */
router.get('/statistics/products', asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const limit = parseInt(req.query.limit) || 10;
  const db = require('../../utils/database');
  
  const products = await db.query(`
    SELECT 
      p.id,
      p.name,
      COUNT(o.id) as orderCount,
      COALESCE(SUM(o.quantity), 0) as soldCount,
      COALESCE(SUM(CASE WHEN o.order_status = 3 THEN o.paid_amount ELSE 0 END), 0) as salesAmount
    FROM product p
    LEFT JOIN order_main o ON p.id = o.product_id 
      AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      AND o.order_status = 3
    GROUP BY p.id, p.name
    ORDER BY salesAmount DESC
    LIMIT ?
  `, [days, limit]);
  
  success(res, products.map(p => ({
    ...p,
    salesAmount: parseFloat(p.salesAmount) || 0,
    orderCount: parseInt(p.orderCount) || 0,
    soldCount: parseInt(p.soldCount) || 0,
  })));
}));

// ========== 操作日志 ==========

/**
 * 清理日志
 * POST /api/admin/logs/clear
 */
router.post('/logs/clear', asyncHandler(async (req, res) => {
  const { days } = req.body;
  
  // 清理指定天数之前的日志
  const keepDays = parseInt(days) || 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - keepDays);
  
  const db = require('../../utils/database');
  const [result] = await db.query(
    'DELETE FROM operation_logs WHERE created_at < ?',
    [cutoffDate]
  );
  
  success(res, { deleted: result.affectedRows }, `已清理 ${result.affectedRows} 条日志`);
}));

// ========== 系统设置 ==========

/**
 * 保存系统设置
 * POST /api/admin/settings
 */
router.post('/settings', asyncHandler(async (req, res) => {
  const settings = req.body;
  const db = require('../../utils/database');
  
  // 更新设置
  for (const [key, value] of Object.entries(settings)) {
    await db.query(
      `INSERT INTO system_settings (setting_key, setting_value, updated_at) 
       VALUES (?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
      [key, typeof value === 'object' ? JSON.stringify(value) : String(value)]
    );
  }
  
  // 清除设置缓存
  await redis.del('settings:*');
  
  success(res, null, '设置保存成功');
}));

/**
 * 测试邮件发送
 * POST /api/admin/settings/test-email
 */
router.post('/settings/test-email', asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  // TODO: 实现邮件发送测试
  // 这里先返回成功
  success(res, null, '测试邮件已发送');
}));

/**
 * 清除缓存
 * POST /api/admin/cache/clear
 */
router.post('/cache/clear', asyncHandler(async (req, res) => {
  // 清除所有业务缓存
  const keys = await redis.keys('*');
  if (keys.length > 0) {
    // 排除 session 缓存
    const cacheKeys = keys.filter(k => !k.startsWith('sess:'));
    if (cacheKeys.length > 0) {
      await redis.del(...cacheKeys);
    }
  }
  
  success(res, null, '缓存已清除');
}));

// ========== 图片上传 ==========

/**
 * 上传图片
 * POST /api/admin/upload/image
 */
router.post('/upload/image', imageUpload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return fail(res, '请选择要上传的图片');
  }
  
  const imageUrl = '/uploads/products/' + req.file.filename;
  success(res, { url: imageUrl }, '上传成功');
}));

// ========== 用户管理 ==========

/**
 * 修改密码
 * PUT /api/admin/password
 */
router.put('/password', asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  
  if (!oldPassword || !newPassword || !confirmPassword) {
    return fail(res, '请填写完整的密码信息');
  }
  
  if (newPassword !== confirmPassword) {
    return fail(res, '两次输入的新密码不一致');
  }
  
  if (newPassword.length < 6) {
    return fail(res, '新密码长度不能少于6位');
  }
  
  const userService = require('../../services/userService');
  await userService.changePassword(req.session.user.id, oldPassword, newPassword);
  
  success(res, null, '密码修改成功');
}));

module.exports = router;
