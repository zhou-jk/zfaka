/**
 * 通用响应工具类
 * 统一 API 响应格式
 */

// 业务错误码定义
const ErrorCodes = {
  // 通用错误 1xxx
  SUCCESS: { code: 0, message: '成功' },
  UNKNOWN_ERROR: { code: 1000, message: '未知错误' },
  PARAM_ERROR: { code: 1001, message: '参数错误' },
  NOT_FOUND: { code: 1002, message: '资源不存在' },
  FORBIDDEN: { code: 1003, message: '无权限访问' },
  RATE_LIMIT: { code: 1004, message: '请求过于频繁' },
  
  // 认证错误 2xxx
  UNAUTHORIZED: { code: 2001, message: '未登录或登录已过期' },
  LOGIN_FAILED: { code: 2002, message: '用户名或密码错误' },
  ACCOUNT_DISABLED: { code: 2003, message: '账号已被禁用' },
  TOKEN_INVALID: { code: 2004, message: 'Token 无效' },
  TOKEN_EXPIRED: { code: 2005, message: 'Token 已过期' },
  
  // 商品错误 3xxx
  PRODUCT_NOT_FOUND: { code: 3001, message: '商品不存在' },
  PRODUCT_OFF_SHELF: { code: 3002, message: '商品已下架' },
  PRODUCT_STOCK_EMPTY: { code: 3003, message: '商品库存不足' },
  
  // 卡密错误 4xxx
  CARD_NOT_FOUND: { code: 4001, message: '卡密不存在' },
  CARD_ALREADY_SOLD: { code: 4002, message: '卡密已售出' },
  CARD_DUPLICATE: { code: 4003, message: '卡密重复' },
  CARD_IMPORT_FAILED: { code: 4004, message: '卡密导入失败' },
  
  // 订单错误 5xxx
  ORDER_NOT_FOUND: { code: 5001, message: '订单不存在' },
  ORDER_EXPIRED: { code: 5002, message: '订单已过期' },
  ORDER_PAID: { code: 5003, message: '订单已支付' },
  ORDER_CANCELLED: { code: 5004, message: '订单已取消' },
  ORDER_CREATE_FAILED: { code: 5005, message: '订单创建失败' },
  
  // 支付错误 6xxx
  PAYMENT_FAILED: { code: 6001, message: '支付失败' },
  PAYMENT_SIGN_ERROR: { code: 6002, message: '支付签名验证失败' },
  PAYMENT_AMOUNT_ERROR: { code: 6003, message: '支付金额不匹配' },
  PAYMENT_DUPLICATE: { code: 6004, message: '重复的支付回调' },
  
  // 发卡错误 7xxx
  DELIVERY_FAILED: { code: 7001, message: '发卡失败' },
  DELIVERY_STOCK_ERROR: { code: 7002, message: '库存分配失败' },
};

/**
 * 成功响应
 * @param {Object} res Express response 对象
 * @param {any} data 响应数据
 * @param {string} message 响应消息
 */
function success(res, data = null, message = '成功') {
  return res.json({
    code: 0,
    message,
    data,
    timestamp: Date.now(),
  });
}

/**
 * 失败响应
 * @param {Object} res Express response 对象
 * @param {Object} error 错误对象 {code, message}
 * @param {any} data 额外数据
 * @param {number} httpStatus HTTP 状态码
 */
function fail(res, error = ErrorCodes.UNKNOWN_ERROR, data = null, httpStatus = 200) {
  return res.status(httpStatus).json({
    code: error.code,
    message: error.message,
    data,
    timestamp: Date.now(),
  });
}

/**
 * 自定义错误响应
 * @param {Object} res Express response 对象
 * @param {number} code 错误码
 * @param {string} message 错误消息
 * @param {any} data 额外数据
 */
function error(res, code, message, data = null) {
  return res.json({
    code,
    message,
    data,
    timestamp: Date.now(),
  });
}

/**
 * 分页响应
 * @param {Object} res Express response 对象
 * @param {Object} result 分页查询结果
 */
function paginated(res, result) {
  return res.json({
    code: 0,
    message: '成功',
    data: result.data,
    pagination: result.pagination,
    timestamp: Date.now(),
  });
}

module.exports = {
  ErrorCodes,
  success,
  fail,
  error,
  paginated,
};
