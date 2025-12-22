/**
 * 前台页面路由
 */

const express = require('express');
const router = express.Router();
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const cardService = require('../services/cardService');
const { asyncHandler } = require('../middlewares/errorHandler');
const { parsePagination } = require('../utils/helpers');

/**
 * 首页 - 商品列表
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { category_id, keyword } = req.query;
  
  const result = await productService.getProductList({
    page,
    limit,
    category_id,
    keyword,
  });
  
  const categories = await productService.getCategoryList();
  
  // 热门商品
  const hotProducts = await productService.getProductList({
    page: 1,
    limit: 4,
    is_hot: 1,
  });
  
  res.render('frontend/index', {
    title: '首页',
    products: result.data,
    pagination: result.pagination,
    categories,
    hotProducts: hotProducts.data,
    currentCategory: category_id,
    keyword,
  });
}));

/**
 * 商品详情页
 */
router.get('/product/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productService.getProductWithStock(id);
  
  if (!product || product.status !== 1) {
    return res.status(404).render('error', {
      title: '商品不存在',
      message: '您访问的商品不存在或已下架',
      code: 404,
    });
  }
  
  res.render('frontend/product', {
    title: product.name,
    product,
  });
}));

/**
 * 订单查询页面
 */
router.get('/order/query', (req, res) => {
  res.render('frontend/order-query', {
    title: '订单查询',
    query: req.query || {},
  });
});

/**
 * 订单详情页
 */
router.get('/order/:orderNo', asyncHandler(async (req, res) => {
  const { orderNo } = req.params;
  
  try {
    const order = await orderService.getOrderDetail(orderNo);
    
    res.render('frontend/order-detail', {
      title: `订单 ${orderNo}`,
      order,
    });
  } catch (error) {
    res.status(404).render('error', {
      title: '订单不存在',
      message: '未找到该订单，请检查订单号是否正确',
      code: 404,
    });
  }
}));

/**
 * 支付结果页面
 */
router.get('/order/result', asyncHandler(async (req, res) => {
  const { order_no, out_trade_no } = req.query;
  
  // 支持订单号或支付单号查询
  const orderNo = order_no || out_trade_no;
  
  if (!orderNo) {
    return res.redirect('/order/query');
  }
  
  try {
    const order = await orderService.getOrderDetail(orderNo);
    
    res.render('frontend/order-result', {
      title: '支付结果',
      order,
    });
  } catch (error) {
    res.render('frontend/order-result', {
      title: '支付结果',
      order: null,
      error: '订单查询失败',
    });
  }
}));

/**
 * 下载卡密
 */
router.get('/order/:orderNo/download', asyncHandler(async (req, res) => {
  const { orderNo } = req.params;
  
  const order = await orderService.getOrderByNo(orderNo);
  
  if (!order) {
    return res.status(404).send('订单不存在');
  }
  
  if (order.order_status !== 3) {
    return res.status(400).send('订单未完成，无法下载卡密');
  }
  
  const cards = await cardService.getCardsByOrderId(order.id);
  
  if (cards.length === 0) {
    return res.status(400).send('没有可下载的卡密');
  }
  
  // 生成文本内容
  let content = `订单号: ${orderNo}\n`;
  content += `商品: ${order.product_name}\n`;
  content += `数量: ${order.quantity}\n`;
  content += `下单时间: ${order.created_at}\n`;
  content += `\n========== 卡密信息 ==========\n\n`;
  
  cards.forEach((card, index) => {
    content += `【卡密 ${index + 1}】\n`;
    content += `卡号: ${card.card_code}\n`;
    if (card.card_secret) {
      content += `密码: ${card.card_secret}\n`;
    }
    content += `\n`;
  });
  
  content += `\n========== END ==========\n`;
  content += `下载时间: ${new Date().toLocaleString('zh-CN')}\n`;
  
  // 设置下载头
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="cards_${orderNo}.txt"`);
  res.send(content);
}));

/**
 * 关于页面
 */
router.get('/about', (req, res) => {
  res.render('frontend/about', {
    title: '关于我们',
  });
});

/**
 * 帮助页面
 */
router.get('/help', (req, res) => {
  res.render('frontend/help', {
    title: '使用帮助',
  });
});

module.exports = router;
