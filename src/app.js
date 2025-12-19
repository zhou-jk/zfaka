/**
 * 主应用入口文件
 * 初始化 Express 应用和所有中间件
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { requestLogger } = require('./middlewares/requestLogger');
const RedisStore = require('./utils/redisStore');
const db = require('./utils/database');
const redis = require('./utils/redis');

// 创建 Express 应用
const app = express();

// ============== 基础中间件 ==============

// 安全头部
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://cdn.bootcdn.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.bootcdn.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.bootcdn.net"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdn.bootcdn.net"],
    },
  },
}));

// CORS 配置
app.use(cors({
  origin: config.server.env === 'development' ? true : config.site.url,
  credentials: true,
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie 解析
app.use(cookieParser());

// Session 配置（使用 Redis 存储）
const sessionConfig = {
  store: new RedisStore({ client: redis.getClient() }),
  secret: config.session.secret,
  name: config.session.name,
  resave: config.session.resave,
  saveUninitialized: config.session.saveUninitialized,
  cookie: {
    maxAge: config.session.maxAge,
    httpOnly: true,
    secure: config.server.env === 'production',
    sameSite: 'lax',
  },
};
app.use(session(sessionConfig));

// 请求日志
app.use(requestLogger);

// ============== 视图引擎 ==============

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// ============== 全局变量 ==============

app.use((req, res, next) => {
  // 站点配置
  res.locals.siteName = config.site.name;
  res.locals.siteUrl = config.site.url;
  // 当前用户
  res.locals.currentUser = req.session?.user || null;
  // Flash 消息
  res.locals.flash = req.session?.flash || {};
  delete req.session.flash;
  next();
});

// ============== 路由注册 ==============

// 前台路由
app.use('/', require('./routes/frontend'));

// API 路由
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/products', require('./routes/api/products'));
app.use('/api/orders', require('./routes/api/orders'));
app.use('/api/payment', require('./routes/api/payment'));
app.use('/api/admin', require('./routes/api/admin'));

// 管理后台路由
app.use('/admin', require('./routes/admin'));

// ============== 错误处理 ==============

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// ============== 启动服务 ==============

async function startServer() {
  try {
    // 测试数据库连接
    await db.testConnection();
    logger.info('数据库连接成功');

    // 测试 Redis 连接
    await redis.testConnection();
    logger.info('Redis 连接成功');

    // 启动服务器
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`服务器启动成功: http://${config.server.host}:${config.server.port}`);
      logger.info(`运行环境: ${config.server.env}`);
    });

    // 优雅关闭
    process.on('SIGTERM', () => gracefulShutdown(server));
    process.on('SIGINT', () => gracefulShutdown(server));

  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(server) {
  logger.info('正在关闭服务器...');
  
  server.close(async () => {
    try {
      await db.close();
      await redis.close();
      logger.info('服务器已安全关闭');
      process.exit(0);
    } catch (error) {
      logger.error('关闭过程中发生错误:', error);
      process.exit(1);
    }
  });

  // 强制关闭超时
  setTimeout(() => {
    logger.error('强制关闭服务器');
    process.exit(1);
  }, 10000);
}

// 启动应用
startServer();

module.exports = app;
