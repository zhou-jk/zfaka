/**
 * 应用配置文件
 * 统一管理所有配置项，从环境变量读取
 */

require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || 'localhost',
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zfaka',
    connectionLimit: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: '+08:00',
  },

  // Redis 配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    keyPrefix: 'zfaka:',
  },

  // Session 配置
  session: {
    secret: process.env.SESSION_SECRET || 'default_session_secret',
    maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) || 86400000, // 24小时
    name: 'zfaka_sid',
    resave: false,
    saveUninitialized: false,
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // 支付宝配置
  alipay: {
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
    returnUrl: process.env.ALIPAY_RETURN_URL || '',
    signType: 'RSA2',
    charset: 'utf-8',
    version: '1.0',
  },

  // 网站配置
  site: {
    name: process.env.SITE_NAME || '自动售货系统',
    url: process.env.SITE_URL || 'http://localhost:3000',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  },

  // 订单配置
  order: {
    expireMinutes: parseInt(process.env.ORDER_EXPIRE_MINUTES, 10) || 30,
    noPrefix: process.env.ORDER_NO_PREFIX || 'ZF',
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'debug',
    dir: process.env.LOG_DIR || 'logs',
  },

  // 安全配置
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
  },

  // 分页默认配置
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },
};
