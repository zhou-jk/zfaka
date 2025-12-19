/**
 * 请求日志中间件
 */

const logger = require('../utils/logger');
const { getClientIp } = require('../utils/helpers');

/**
 * 请求日志记录
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const ip = getClientIp(req);
  
  // 记录请求
  const logData = {
    method: req.method,
    url: req.url,
    ip,
    userAgent: req.get('user-agent'),
  };
  
  // 响应完成后记录
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger.log(level, `${req.method} ${req.url} ${res.statusCode} ${duration}ms`, {
      ...logData,
      statusCode: res.statusCode,
      duration,
    });
  });
  
  next();
}

module.exports = {
  requestLogger,
};
