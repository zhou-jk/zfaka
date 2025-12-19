/**
 * 请求验证中间件
 */

const { body, param, query, validationResult } = require('express-validator');
const { ErrorCodes, fail } = require('../utils/response');

/**
 * 验证结果处理
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array();
    return fail(res, {
      code: ErrorCodes.PARAM_ERROR.code,
      message: errorList[0]?.msg || '参数验证失败',
    }, errorList);
  }
  next();
}

/**
 * 常用验证规则
 */
const rules = {
  // ID 验证
  id: param('id')
    .isInt({ min: 1 })
    .withMessage('ID 必须是正整数'),
  
  // 分页验证
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页条数必须是 1-100 之间的整数'),
  
  // 用户名验证
  username: body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在 3-50 之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  // 密码验证
  password: body('password')
    .isLength({ min: 6, max: 50 })
    .withMessage('密码长度必须在 6-50 之间'),
  
  // 邮箱验证
  email: body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),
  
  // 必填邮箱
  requiredEmail: body('email')
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),
  
  // 商品名称
  productName: body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('商品名称长度必须在 1-100 之间'),
  
  // 商品价格
  productPrice: body('price')
    .isFloat({ min: 0.01 })
    .withMessage('价格必须大于 0'),
  
  // 购买数量
  quantity: body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('购买数量必须是 1-100 之间的整数'),
  
  // 订单号
  orderNo: body('order_no')
    .trim()
    .isLength({ min: 10, max: 50 })
    .withMessage('订单号格式不正确'),
  
  // 支付渠道
  payChannel: body('pay_channel')
    .isIn(['alipay', 'wechat', 'manual'])
    .withMessage('支付渠道不正确'),
};

/**
 * 组合验证规则
 */
const validators = {
  // 登录验证
  login: [
    body('username').trim().notEmpty().withMessage('请输入用户名'),
    body('password').notEmpty().withMessage('请输入密码'),
    validate,
  ],
  
  // 创建订单验证
  createOrder: [
    body('product_id').isInt({ min: 1 }).withMessage('商品 ID 不正确'),
    body('quantity').isInt({ min: 1, max: 100 }).withMessage('购买数量必须是 1-100'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('邮箱格式不正确'),
    validate,
  ],
  
  // 查询订单验证
  queryOrder: [
    query('order_no').optional().trim(),
    query('email').optional().isEmail().withMessage('邮箱格式不正确'),
    validate,
  ],
  
  // 商品验证
  product: [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('商品名称不能为空'),
    body('price').isFloat({ min: 0.01 }).withMessage('价格必须大于 0'),
    body('description').optional().trim(),
    body('status').optional().isIn([0, 1]).withMessage('状态值不正确'),
    validate,
  ],
  
  // 卡密导入验证
  cardImport: [
    body('product_id').isInt({ min: 1 }).withMessage('请选择商品'),
    body('cards').isArray({ min: 1 }).withMessage('卡密列表不能为空'),
    body('cards.*.code').trim().notEmpty().withMessage('卡密不能为空'),
    validate,
  ],
  
  // 分页验证
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('页码不正确'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页条数不正确'),
    validate,
  ],
};

module.exports = {
  validate,
  rules,
  validators,
  body,
  param,
  query,
  validationResult,
};
