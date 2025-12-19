/**
 * 错误处理中间件
 */

const logger = require('../utils/logger');
const { ErrorCodes, fail } = require('../utils/response');
const config = require('../config');

/**
 * 自定义业务错误类
 */
class BusinessError extends Error {
  constructor(errorCode, data = null) {
    super(errorCode.message);
    this.name = 'BusinessError';
    this.code = errorCode.code;
    this.data = data;
  }
}

/**
 * 404 处理中间件
 */
function notFoundHandler(req, res, next) {
  // API 请求返回 JSON
  if (req.path.startsWith('/api/')) {
    return fail(res, ErrorCodes.NOT_FOUND, null, 404);
  }
  
  // 页面请求渲染 404 页面
  res.status(404).render('error', {
    title: '页面不存在',
    message: '您访问的页面不存在',
    code: 404,
  });
}

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 记录错误日志
  logger.error('请求错误:', {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    body: req.body,
  });

  // 业务错误
  if (err instanceof BusinessError) {
    return res.json({
      code: err.code,
      message: err.message,
      data: err.data,
      timestamp: Date.now(),
    });
  }

  // 验证错误（express-validator）
  if (err.array && typeof err.array === 'function') {
    const errors = err.array();
    return fail(res, {
      code: ErrorCodes.PARAM_ERROR.code,
      message: errors[0]?.msg || '参数验证失败',
    }, errors);
  }

  // CSRF 错误
  if (err.code === 'EBADCSRFTOKEN') {
    return fail(res, {
      code: 1005,
      message: 'CSRF 验证失败，请刷新页面重试',
    }, null, 403);
  }

  // JSON 解析错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return fail(res, {
      code: ErrorCodes.PARAM_ERROR.code,
      message: '请求体格式错误',
    }, null, 400);
  }

  // 默认错误响应
  const isDev = config.server.env === 'development';
  
  // API 请求返回 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      code: ErrorCodes.UNKNOWN_ERROR.code,
      message: isDev ? err.message : '服务器内部错误',
      data: isDev ? { stack: err.stack } : null,
      timestamp: Date.now(),
    });
  }

  // 页面请求渲染错误页面
  res.status(500).render('error', {
    title: '服务器错误',
    message: isDev ? err.message : '服务器内部错误，请稍后重试',
    code: 500,
    stack: isDev ? err.stack : null,
  });
}

/**
 * 异步路由包装器
 * 自动捕获异步错误并传递给错误处理中间件
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  BusinessError,
  notFoundHandler,
  errorHandler,
  asyncHandler,
};
