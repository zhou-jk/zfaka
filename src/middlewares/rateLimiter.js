/**
 * 速率限制中间件
 */

const redis = require('../utils/redis');
const config = require('../config');
const { ErrorCodes, fail } = require('../utils/response');
const { getClientIp } = require('../utils/helpers');

/**
 * 创建速率限制器
 * @param {Object} options 配置选项
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = config.security.rateLimitWindowMs,
    max = config.security.rateLimitMaxRequests,
    keyPrefix = 'ratelimit:',
    keyGenerator = (req) => getClientIp(req),
    skip = () => false,
    message = '请求过于频繁，请稍后再试',
  } = options;
  
  return async (req, res, next) => {
    try {
      // 跳过检查
      if (skip(req)) {
        return next();
      }
      
      const key = keyPrefix + keyGenerator(req);
      const windowSeconds = Math.ceil(windowMs / 1000);
      
      // 使用 Redis 计数
      const current = await redis.incr(key);
      
      // 首次访问设置过期时间
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      
      // 设置响应头
      res.set('X-RateLimit-Limit', max);
      res.set('X-RateLimit-Remaining', Math.max(0, max - current));
      
      // 超过限制
      if (current > max) {
        res.set('Retry-After', windowSeconds);
        return fail(res, {
          code: ErrorCodes.RATE_LIMIT.code,
          message,
        }, null, 429);
      }
      
      next();
    } catch (error) {
      // Redis 出错时放行请求
      next();
    }
  };
}

/**
 * 全局速率限制
 */
const globalRateLimiter = createRateLimiter();

/**
 * API 速率限制（更严格）
 */
const apiRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 分钟
  max: 60,
  keyPrefix: 'ratelimit:api:',
});

/**
 * 登录速率限制
 */
const loginRateLimiter = createRateLimiter({
  windowMs: 300000, // 5 分钟
  max: 5,
  keyPrefix: 'ratelimit:login:',
  keyGenerator: (req) => `${getClientIp(req)}:${req.body?.username || ''}`,
  message: '登录尝试次数过多，请 5 分钟后再试',
});

/**
 * 订单创建速率限制
 */
const orderRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 分钟
  max: 10,
  keyPrefix: 'ratelimit:order:',
  message: '下单过于频繁，请稍后再试',
});

module.exports = {
  createRateLimiter,
  globalRateLimiter,
  apiRateLimiter,
  loginRateLimiter,
  orderRateLimiter,
};
