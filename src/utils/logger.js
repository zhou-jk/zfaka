/**
 * 日志工具类
 * 使用 Winston 实现分级日志记录
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// 确保日志目录存在
const logDir = path.join(process.cwd(), config.log.dir);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// 控制台格式（带颜色）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

// 创建 Logger 实例
const logger = winston.createLogger({
  level: config.log.level,
  format: logFormat,
  defaultMeta: { service: 'zfaka' },
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // 所有日志
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760,
      maxFiles: 10,
    }),
    // 访问日志
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      level: 'http',
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ],
});

// 开发环境添加控制台输出
if (config.server.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// 扩展方法：记录操作日志到数据库
logger.logOperation = async function(operatorId, opType, targetType, targetId, content, ip) {
  try {
    const db = require('./database');
    await db.query(
      `INSERT INTO operation_log (operator_id, op_type, target_type, target_id, content, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [operatorId, opType, targetType, targetId, JSON.stringify(content), ip]
    );
  } catch (error) {
    logger.error('记录操作日志失败:', error);
  }
};

module.exports = logger;
