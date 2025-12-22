/**
 * 认证与授权中间件
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { ErrorCodes, fail } = require('../utils/response');

/**
 * 验证管理员登录状态（Session 方式）
 */
function requireAdminAuth(req, res, next) {
  // 检查是否是 API 请求
  const isApiRequest = req.originalUrl.startsWith('/api/') || 
                       req.xhr || 
                       req.headers['content-type']?.includes('multipart/form-data') ||
                       req.headers.accept?.includes('application/json');
  
  if (!req.session || !req.session.user) {
    // API 请求返回 JSON
    if (isApiRequest) {
      return fail(res, ErrorCodes.UNAUTHORIZED);
    }
    // 页面请求重定向到登录
    req.session.returnTo = req.originalUrl;
    return res.redirect('/admin/login');
  }
  
  // 验证是否是管理员
  if (req.session.user.role !== 1) {
    if (isApiRequest) {
      return fail(res, ErrorCodes.FORBIDDEN);
    }
    return res.redirect('/admin/login');
  }
  
  next();
}

/**
 * 验证 JWT Token（用于 API）
 */
function requireToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, ErrorCodes.UNAUTHORIZED);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return fail(res, ErrorCodes.TOKEN_EXPIRED);
    }
    return fail(res, ErrorCodes.TOKEN_INVALID);
  }
}

/**
 * 可选的 Token 验证（不强制）
 */
function optionalToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
    } catch (error) {
      // 忽略无效 token
    }
  }
  
  next();
}

/**
 * 检查用户角色
 * @param {number[]} roles 允许的角色列表
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.user && !req.user) {
      return fail(res, ErrorCodes.UNAUTHORIZED);
    }
    
    const userRole = req.session?.user?.role || req.user?.role;
    
    if (!roles.includes(userRole)) {
      return fail(res, ErrorCodes.FORBIDDEN);
    }
    
    next();
  };
}

/**
 * 生成 JWT Token
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * 刷新 Session 过期时间
 */
function refreshSession(req, res, next) {
  if (req.session && req.session.user) {
    req.session.touch();
  }
  next();
}

module.exports = {
  requireAdminAuth,
  requireToken,
  optionalToken,
  requireRole,
  generateToken,
  refreshSession,
};
