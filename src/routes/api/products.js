/**
 * 商品 API 路由
 */

const express = require('express');
const router = express.Router();
const productService = require('../../services/productService');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { success, fail, paginated, ErrorCodes } = require('../../utils/response');
const { requireAdminAuth } = require('../../middlewares/auth');
const { validators, body, validate } = require('../../middlewares/validator');
const { parsePagination } = require('../../utils/helpers');

/**
 * 获取商品列表（前台）
 * GET /api/products
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { category_id, keyword, is_hot, is_recommend } = req.query;
  
  const result = await productService.getProductList({
    page,
    limit,
    category_id,
    keyword,
    is_hot: is_hot ? parseInt(is_hot) : undefined,
    is_recommend: is_recommend ? parseInt(is_recommend) : undefined,
  });
  
  paginated(res, result);
}));

/**
 * 获取商品详情（前台）
 * GET /api/products/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productService.getProductWithStock(id);
  
  if (!product || product.status !== 1) {
    return fail(res, ErrorCodes.PRODUCT_NOT_FOUND);
  }
  
  success(res, { product });
}));

/**
 * 获取分类列表
 * GET /api/products/categories/list
 */
router.get('/categories/list', asyncHandler(async (req, res) => {
  const categories = await productService.getCategoryList();
  success(res, { categories });
}));

// ========== 以下需要管理员权限 ==========

/**
 * 获取商品列表（后台）
 * GET /api/products/admin/list
 */
router.get('/admin/list', requireAdminAuth, asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { category_id, status, keyword } = req.query;
  
  const result = await productService.getProductListAdmin({
    page,
    limit,
    category_id,
    status: status !== undefined ? parseInt(status) : undefined,
    keyword,
  });
  
  paginated(res, result);
}));

/**
 * 获取商品详情（后台）
 * GET /api/products/admin/:id
 */
router.get('/admin/:id', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await productService.getProductById(id, true);
  
  if (!product) {
    return fail(res, ErrorCodes.PRODUCT_NOT_FOUND);
  }
  
  success(res, { product });
}));

/**
 * 创建商品
 * POST /api/products/admin
 */
router.post('/admin', requireAdminAuth, validators.product, asyncHandler(async (req, res) => {
  const result = await productService.createProduct(req.body, req.session.user.id);
  success(res, result, '商品创建成功');
}));

/**
 * 更新商品
 * PUT /api/products/admin/:id
 */
router.put('/admin/:id', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await productService.updateProduct(id, req.body, req.session.user.id);
  success(res, null, '商品更新成功');
}));

/**
 * 删除商品（下架）
 * DELETE /api/products/admin/:id
 */
router.delete('/admin/:id', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await productService.deleteProduct(id);
  success(res, null, '商品已下架');
}));

/**
 * 更新商品状态
 * PATCH /api/products/admin/:id/status
 */
router.patch('/admin/:id/status', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  await productService.updateProduct(id, { status }, req.session.user.id);
  success(res, null, status === 1 ? '商品已上架' : '商品已下架');
}));

/**
 * 同步商品库存
 * POST /api/products/admin/sync-stock
 */
router.post('/admin/sync-stock', requireAdminAuth, asyncHandler(async (req, res) => {
  await productService.syncAllProductStock();
  success(res, null, '库存同步完成');
}));

// ========== 分类管理 ==========

/**
 * 创建分类
 * POST /api/products/admin/categories
 */
router.post('/admin/categories', requireAdminAuth, asyncHandler(async (req, res) => {
  const result = await productService.createCategory(req.body);
  success(res, result, '分类创建成功');
}));

/**
 * 更新分类
 * PUT /api/products/admin/categories/:id
 */
router.put('/admin/categories/:id', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await productService.updateCategory(id, req.body);
  success(res, null, '分类更新成功');
}));

/**
 * 删除分类
 * DELETE /api/products/admin/categories/:id
 */
router.delete('/admin/categories/:id', requireAdminAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await productService.deleteCategory(id);
  success(res, null, '分类删除成功');
}));

module.exports = router;
