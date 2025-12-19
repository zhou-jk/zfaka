/**
 * 认证 API 路由
 */

const express = require('express');
const router = express.Router();
const userService = require('../../services/userService');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { success, fail, ErrorCodes } = require('../../utils/response');
const { validators } = require('../../middlewares/validator');
const { loginRateLimiter } = require('../../middlewares/rateLimiter');
const { requireAdminAuth } = require('../../middlewares/auth');
const { getClientIp } = require('../../utils/helpers');

/**
 * 管理员登录
 * POST /api/auth/login
 */
router.post('/login', loginRateLimiter, validators.login, asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await userService.adminLogin(username, password, req);
    
    // 保存到 Session
    req.session.user = user;
    req.session.loginTime = Date.now();
    
    success(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    }, '登录成功');
    
  } catch (error) {
    fail(res, error);
  }
}));

/**
 * 退出登录
 * POST /api/auth/logout
 */
router.post('/logout', asyncHandler(async (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return fail(res, { code: 2020, message: '退出登录失败' });
      }
      res.clearCookie('zfaka_sid');
      success(res, null, '退出成功');
    });
  } else {
    success(res, null, '退出成功');
  }
}));

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', requireAdminAuth, asyncHandler(async (req, res) => {
  const user = req.session.user;
  
  if (!user) {
    return fail(res, ErrorCodes.UNAUTHORIZED);
  }
  
  // 获取最新用户信息
  const userInfo = await userService.getUserById(user.id);
  
  success(res, { user: userInfo });
}));

/**
 * 修改密码
 * POST /api/auth/change-password
 */
router.post('/change-password', requireAdminAuth, asyncHandler(async (req, res) => {
  const { old_password, new_password } = req.body;
  
  if (!old_password || !new_password) {
    return fail(res, { code: 1001, message: '请输入原密码和新密码' });
  }
  
  if (new_password.length < 6) {
    return fail(res, { code: 1001, message: '新密码长度不能少于6位' });
  }
  
  try {
    await userService.changePassword(req.session.user.id, old_password, new_password);
    success(res, null, '密码修改成功');
  } catch (error) {
    fail(res, error);
  }
}));

/**
 * 刷新 Session
 * POST /api/auth/refresh
 */
router.post('/refresh', requireAdminAuth, asyncHandler(async (req, res) => {
  req.session.touch();
  success(res, { expires: new Date(Date.now() + req.session.cookie.maxAge) });
}));

module.exports = router;
