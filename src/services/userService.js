/**
 * 用户服务层
 * 处理用户认证、管理等业务逻辑
 */

const bcrypt = require('bcryptjs');
const db = require('../utils/database');
const logger = require('../utils/logger');
const config = require('../config');
const { BusinessError } = require('../middlewares/errorHandler');
const { ErrorCodes } = require('../utils/response');
const { getClientIp } = require('../utils/helpers');

class UserService {
  /**
   * 管理员登录
   * @param {string} username 用户名
   * @param {string} password 密码
   * @param {Object} req 请求对象（用于获取IP等）
   * @returns {Object} 用户信息
   */
  async adminLogin(username, password, req) {
    // 查询用户
    const user = await db.queryOne(
      'SELECT * FROM sys_user WHERE username = ? AND role = 1',
      [username],
    );
    
    if (!user) {
      // 记录失败日志
      await logger.logOperation(null, 'LOGIN_FAILED', 'user', null, {
        username,
        reason: '用户不存在',
      }, getClientIp(req));
      throw new BusinessError(ErrorCodes.LOGIN_FAILED);
    }
    
    // 检查账号状态
    if (user.status !== 1) {
      throw new BusinessError(ErrorCodes.ACCOUNT_DISABLED);
    }
    
    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      await logger.logOperation(null, 'LOGIN_FAILED', 'user', user.id, {
        username,
        reason: '密码错误',
      }, getClientIp(req));
      throw new BusinessError(ErrorCodes.LOGIN_FAILED);
    }
    
    // 更新登录信息
    const ip = getClientIp(req);
    await db.update('sys_user', {
      last_login_at: new Date(),
      last_login_ip: ip,
      login_count: user.login_count + 1,
    }, { id: user.id });
    
    // 记录成功日志
    await logger.logOperation(user.id, 'LOGIN_SUCCESS', 'user', user.id, {
      username,
    }, ip);
    
    // 返回用户信息（不包含敏感字段）
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      last_login_at: user.last_login_at,
    };
  }
  
  /**
   * 根据ID获取用户
   */
  async getUserById(id) {
    const user = await db.queryOne(
      'SELECT id, username, email, phone, role, avatar, status, last_login_at, created_at FROM sys_user WHERE id = ?',
      [id],
    );
    return user;
  }
  
  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username) {
    const user = await db.queryOne(
      'SELECT id, username, email, phone, role, status FROM sys_user WHERE username = ?',
      [username],
    );
    return user;
  }
  
  /**
   * 创建用户
   */
  async createUser(data) {
    // 检查用户名是否存在
    const existing = await this.getUserByUsername(data.username);
    if (existing) {
      throw new BusinessError({
        code: 2010,
        message: '用户名已存在',
      });
    }
    
    // 密码加密
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    const passwordHash = await bcrypt.hash(data.password, salt);
    
    const result = await db.insert('sys_user', {
      username: data.username,
      password_hash: passwordHash,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role || 2,
      status: 1,
    });
    
    return { id: result.insertId };
  }
  
  /**
   * 更新用户信息
   */
  async updateUser(id, data) {
    const updateData = {};
    
    if (data.username !== undefined) {
      // 检查用户名是否已存在
      const existing = await db.queryOne(
        'SELECT id FROM sys_user WHERE username = ? AND id != ?',
        [data.username, id],
      );
      if (existing) {
        throw new BusinessError({
          code: 2012,
          message: '用户名已被占用',
        });
      }
      updateData.username = data.username;
    }
    if (data.email !== undefined) {updateData.email = data.email;}
    if (data.phone !== undefined) {updateData.phone = data.phone;}
    if (data.avatar !== undefined) {updateData.avatar = data.avatar;}
    if (data.status !== undefined) {updateData.status = data.status;}
    
    if (Object.keys(updateData).length === 0) {
      return { affectedRows: 0 };
    }
    
    return await db.update('sys_user', updateData, { id });
  }
  
  /**
   * 修改密码
   */
  async changePassword(id, oldPassword, newPassword) {
    const user = await db.queryOne(
      'SELECT password_hash FROM sys_user WHERE id = ?',
      [id],
    );
    
    if (!user) {
      throw new BusinessError(ErrorCodes.NOT_FOUND);
    }
    
    // 验证旧密码
    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) {
      throw new BusinessError({
        code: 2011,
        message: '原密码错误',
      });
    }
    
    // 加密新密码
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    await db.update('sys_user', { password_hash: passwordHash }, { id });
    
    return true;
  }
  
  /**
   * 重置密码（管理员操作）
   */
  async resetPassword(id, newPassword) {
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    await db.update('sys_user', { password_hash: passwordHash }, { id });
    
    return true;
  }
  
  /**
   * 获取用户列表（分页）
   */
  async getUserList(params = {}) {
    const { page = 1, limit = 20, role, status, keyword } = params;
    
    let sql = `
      SELECT id, username, email, phone, role, status, 
             last_login_at, last_login_ip, login_count, created_at
      FROM sys_user WHERE 1=1
    `;
    const sqlParams = [];
    
    if (role !== undefined) {
      sql += ' AND role = ?';
      sqlParams.push(role);
    }
    
    if (status !== undefined) {
      sql += ' AND status = ?';
      sqlParams.push(status);
    }
    
    if (keyword) {
      sql += ' AND (username LIKE ? OR email LIKE ?)';
      sqlParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    sql += ' ORDER BY id DESC';
    
    return await db.paginate(sql, sqlParams, page, limit);
  }
  
  /**
   * 禁用/启用用户
   */
  async toggleUserStatus(id, status) {
    return await db.update('sys_user', { status }, { id });
  }
}

module.exports = new UserService();
