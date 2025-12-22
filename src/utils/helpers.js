/**
 * 通用工具函数
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

/**
 * 生成订单号
 * 格式: 前缀 + 年月日时分秒 + 4位随机数
 */
function generateOrderNo() {
  const prefix = config.order.noPrefix;
  const date = new Date();
  const dateStr = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join('');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}

/**
 * 生成 UUID
 */
function generateUUID() {
  return uuidv4();
}

/**
 * 生成随机字符串
 * @param {number} length 长度
 * @param {string} charset 字符集
 */
function randomString(length = 16, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * MD5 哈希
 */
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * SHA256 哈希
 */
function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * 格式化金额（分转元）
 */
function formatAmount(cents) {
  return (cents / 100).toFixed(2);
}

/**
 * 金额转分
 */
function toCents(yuan) {
  return Math.round(parseFloat(yuan) * 100);
}

/**
 * 隐藏邮箱中间部分
 */
function maskEmail(email) {
  if (!email) {return '';}
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user[0]}***@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

/**
 * 隐藏手机号中间部分
 */
function maskPhone(phone) {
  if (!phone || phone.length < 7) {return phone;}
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

/**
 * XSS 过滤
 */
function escapeHtml(str) {
  if (!str) {return '';}
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * 获取客户端 IP
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         '0.0.0.0';
}

/**
 * 解析分页参数
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || config.pagination.defaultPage);
  let limit = parseInt(query.limit, 10) || config.pagination.defaultLimit;
  limit = Math.min(limit, config.pagination.maxLimit);
  return { page, limit };
}

/**
 * 休眠函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 */
async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await sleep(delay * (i + 1));
      }
    }
  }
  throw lastError;
}

/**
 * 日期格式化
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) {return '';}
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 计算过期时间
 */
function getExpireTime(minutes) {
  const now = new Date();
  return new Date(now.getTime() + minutes * 60 * 1000);
}

/**
 * 检查是否过期
 */
function isExpired(expireTime) {
  if (!expireTime) {return false;}
  return new Date(expireTime) < new Date();
}

/**
 * 对象转查询字符串
 */
function objectToQueryString(obj) {
  return Object.keys(obj)
    .filter(key => obj[key] !== undefined && obj[key] !== null && obj[key] !== '')
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
}

/**
 * 验证邮箱格式
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * 验证手机号格式（中国大陆）
 */
function isValidPhone(phone) {
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
}

module.exports = {
  generateOrderNo,
  generateUUID,
  randomString,
  md5,
  sha256,
  formatAmount,
  toCents,
  maskEmail,
  maskPhone,
  escapeHtml,
  getClientIp,
  parsePagination,
  sleep,
  retry,
  formatDate,
  getExpireTime,
  isExpired,
  objectToQueryString,
  isValidEmail,
  isValidPhone,
};
