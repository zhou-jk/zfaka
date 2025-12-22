/**
 * 管理后台路由
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const productService = require('../services/productService');
const cardService = require('../services/cardService');
const orderService = require('../services/orderService');
const statisticsService = require('../services/statisticsService');
const { asyncHandler } = require('../middlewares/errorHandler');
const { requireAdminAuth } = require('../middlewares/auth');
const { success, fail, paginated } = require('../utils/response');
const { parsePagination, formatDate } = require('../utils/helpers');
const logger = require('../utils/logger');

// 文件上传配置
const upload = multer({
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
  },
});

/**
 * 登录页面
 */
router.get('/login', (req, res) => {
  if (req.session?.user?.role === 1) {
    return res.redirect('/admin');
  }
  res.render('admin/login', {
    title: '管理员登录',
    layout: false,
  });
});

// 以下路由需要登录
router.use(requireAdminAuth);

/**
 * 后台首页（仪表盘）
 * 同时支持 /admin 和 /admin/dashboard 两个路径
 */
router.get(['/', '/dashboard'], asyncHandler(async (req, res) => {
  const stats = await statisticsService.getDashboardStats();
  const trend = await statisticsService.getTrendData(7);
  const ranking = await statisticsService.getProductRanking(5, 30);
  
  res.render('admin/dashboard', {
    title: '仪表盘',
    stats,
    trend,
    ranking,
  });
}));

/**
 * 商品管理页面
 */
router.get('/products', asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await productService.getProductListAdmin({
    page,
    limit,
    ...req.query,
  });
  
  const categories = await productService.getCategoryList();
  
  res.render('admin/products', {
    title: '商品管理',
    products: result.data,
    pagination: result.pagination,
    categories,
    query: req.query,
  });
}));

/**
 * 添加商品页面
 */
router.get('/products/add', asyncHandler(async (req, res) => {
  const categories = await productService.getCategoryList();
  
  res.render('admin/product-edit', {
    title: '添加商品',
    product: null,
    categories,
  });
}));

/**
 * 编辑商品页面
 */
router.get('/products/:id/edit', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productService.getProductById(id, true);
  
  if (!product) {
    return res.status(404).render('error', {
      title: '商品不存在',
      message: '商品不存在',
      code: 404,
    });
  }
  
  const categories = await productService.getCategoryList();
  
  res.render('admin/product-edit', {
    title: '编辑商品',
    product,
    categories,
  });
}));

/**
 * 卡密管理页面
 */
router.get('/cards', asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await cardService.getCardList({
    page,
    limit,
    ...req.query,
  });
  
  // 获取商品列表用于筛选
  const productsResult = await productService.getProductListAdmin({ limit: 100 });
  
  res.render('admin/cards', {
    title: '卡密管理',
    cards: result.data,
    pagination: result.pagination,
    products: productsResult.data,
    query: req.query,
  });
}));

/**
 * 卡密导入页面
 */
router.get('/cards/import', asyncHandler(async (req, res) => {
  const productsResult = await productService.getProductListAdmin({ limit: 100, status: 1 });
  const recentBatches = await cardService.getRecentBatches(10);
  
  res.render('admin/card-import', {
    title: '导入卡密',
    products: productsResult.data,
    recentBatches,
  });
}));

/**
 * 卡密导入处理
 */
router.post('/cards/import', upload.single('file'), asyncHandler(async (req, res) => {
  const { product_id } = req.body;
  const file = req.file;
  
  if (!product_id) {
    return fail(res, { code: 1001, message: '请选择商品' });
  }
  
  if (!file) {
    return fail(res, { code: 1001, message: '请上传卡密文件' });
  }
  
  // 解析文件内容
  const content = file.buffer.toString('utf-8');
  const lines = content.split(/[\r\n]+/).filter(line => line.trim());
  
  // 解析卡密（支持多种格式）
  const cards = lines.map(line => {
    const parts = line.split(/[,\t|]/).map(p => p.trim());
    return {
      code: parts[0],
      secret: parts[1] || null,
    };
  }).filter(card => card.code);
  
  if (cards.length === 0) {
    return fail(res, { code: 1001, message: '未解析到有效卡密' });
  }
  
  try {
    const result = await cardService.importCards(
      parseInt(product_id),
      cards,
      req.session.user.id,
      file.originalname
    );
    
    success(res, result, `成功导入 ${result.success} 条卡密`);
  } catch (error) {
    fail(res, error);
  }
}));

/**
 * 导入批次列表
 */
router.get('/cards/batches', asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await cardService.getBatchList({
    page,
    limit,
    ...req.query,
  });
  
  res.render('admin/card-batches', {
    title: '导入批次',
    batches: result.data,
    pagination: result.pagination,
    query: req.query,
  });
}));

/**
 * 导出卡密
 */
router.get('/cards/export', asyncHandler(async (req, res) => {
  const { product_id, status } = req.query;
  
  const cards = await cardService.exportCards({
    product_id,
    status: status !== undefined ? parseInt(status) : undefined,
  });
  
  // 生成文本内容
  let content = cards.map(card => {
    if (card.card_secret) {
      return `${card.card_code}\t${card.card_secret}`;
    }
    return card.card_code;
  }).join('\n');
  
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="cards_export_${Date.now()}.txt"`);
  res.send(content);
}));

/**
 * 作废卡密
 */
router.post('/cards/:id/void', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  await cardService.voidCard(parseInt(id), reason || '管理员作废', req.session.user.id);
  success(res, null, '卡密已作废');
}));

/**
 * 订单管理页面
 */
router.get('/orders', asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const productsResult = await productService.getProductListAdmin({ limit: 200, status: 1 });
  const result = await orderService.getOrderList({
    page,
    limit,
    ...req.query,
  });
  const stats = await orderService.getOrderStats(req.query);
  
  res.render('admin/orders', {
    title: '订单管理',
    orders: result.data,
    pagination: result.pagination,
    products: productsResult.data,
    stats,
    query: req.query,
  });
}));

/**
 * 订单详情页面
 */
router.get('/orders/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.getOrderById(id);
  
  if (!order) {
    return res.status(404).render('error', {
      title: '订单不存在',
      message: '订单不存在',
      code: 404,
    });
  }
  
  // 获取卡密
  if (order.order_status === 3) {
    order.cards = await cardService.getCardsByOrderId(order.id);
  }
  
  // 获取支付记录
  const paymentService = require('../services/paymentService');
  order.payments = await paymentService.getPaymentsByOrderId(order.id);
  
  res.render('admin/order-detail', {
    title: `订单 ${order.order_no}`,
    order,
  });
}));

/**
 * 统计报表页面
 */
router.get('/statistics', asyncHandler(async (req, res) => {
  const stats = await statisticsService.getDashboardStats();
  const trend = await statisticsService.getTrendData(30);
  const ranking = await statisticsService.getProductRanking(10, 30);
  const channelStats = await statisticsService.getChannelStats(30);
  
  res.render('admin/statistics', {
    title: '统计报表',
    stats,
    trend,
    ranking,
    channelStats,
  });
}));

/**
 * 操作日志页面
 */
router.get('/logs', asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await statisticsService.getOperationLogs({
    page,
    limit,
    ...req.query,
  });
  
  res.render('admin/logs', {
    title: '操作日志',
    logs: result.data,
    pagination: result.pagination,
    query: req.query,
  });
}));

/**
 * 系统设置页面
 */
router.get('/settings', asyncHandler(async (req, res) => {
  const db = require('../utils/database');
  const configs = await db.query('SELECT * FROM sys_config ORDER BY id');
  
  res.render('admin/settings', {
    title: '系统设置',
    configs,
  });
}));

/**
 * 保存系统设置
 */
router.post('/settings', asyncHandler(async (req, res) => {
  const db = require('../utils/database');
  const { configs } = req.body;
  
  if (configs && typeof configs === 'object') {
    for (const [key, value] of Object.entries(configs)) {
      await db.query(
        'UPDATE sys_config SET config_value = ? WHERE config_key = ?',
        [value, key]
      );
    }
  }
  
  success(res, null, '设置已保存');
}));

/**
 * 分类管理页面
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await productService.getCategoryList();
  
  res.render('admin/categories', {
    title: '分类管理',
    categories,
  });
}));

/**
 * 个人信息页面
 */
router.get('/profile', asyncHandler(async (req, res) => {
  res.render('admin/profile', {
    title: '个人设置',
    user: req.session.user,
  });
}));

/**
 * 修改密码页面
 */
router.get('/password', asyncHandler(async (req, res) => {
  res.render('admin/password', {
    title: '修改密码',
    user: req.session.user,
  });
}));

module.exports = router;
