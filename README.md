# 自动售货系统 (Auto Card Selling System)

基于 Node.js + MySQL + Redis 的自动售卡系统，支持虚拟商品（卡密）自动发货。

## 功能特性

### 买家端
- 🛒 商品浏览与搜索
- 🛍️ 在线下单购买
- 💳 支付宝支付（沙箱环境）
- 📦 支付成功自动发货
- 🔍 订单查询（订单号/邮箱）

### 管理后台
- 📊 数据统计仪表盘
- 📦 商品管理（分类、上下架）
- 🔑 卡密管理（导入、作废）
- 📋 订单管理（查询、导出）
- ⚙️ 系统设置
- 📝 操作日志

### 技术特点
- ⚡ Express.js 高性能后端
- 🔒 Session + JWT 双重认证
- 💾 Redis 缓存与分布式锁
- 🔐 密码 bcrypt 加密
- 📝 Winston 日志系统
- 🛡️ Helmet 安全防护
- ⏱️ 请求限流保护

## 技术栈

- **后端框架**: Express.js 4.18
- **数据库**: MySQL 8.0
- **缓存**: Redis 6+
- **模板引擎**: EJS
- **前端框架**: Bootstrap 5.3
- **支付接口**: Alipay SDK

## 快速开始

### 环境要求
- Node.js 18+ LTS
- MySQL 8.0+
- Redis 6+

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

关键配置项：
```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=card_shop

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Session密钥（请修改为随机字符串）
SESSION_SECRET=your-session-secret-key

# 支付宝配置（沙箱环境）
ALIPAY_APP_ID=your-app-id
ALIPAY_PRIVATE_KEY=your-private-key
ALIPAY_PUBLIC_KEY=alipay-public-key
```

### 3. 初始化数据库

```bash
# 创建数据库表
npm run db:init

# 填充测试数据（可选）
npm run db:seed
```

### 4. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm start
```

访问地址：
- 前台首页: http://localhost:3000
- 管理后台: http://localhost:3000/admin

默认管理员账号：
- 用户名: `admin`
- 密码: `admin123`

## 项目结构

```
├── src/
│   ├── app.js              # 应用入口
│   ├── config/             # 配置文件
│   ├── middlewares/        # 中间件
│   │   ├── auth.js         # 认证中间件
│   │   ├── errorHandler.js # 错误处理
│   │   ├── rateLimiter.js  # 限流
│   │   ├── requestLogger.js# 请求日志
│   │   └── validator.js    # 参数验证
│   ├── routes/             # 路由
│   │   ├── api/            # API路由
│   │   ├── admin.js        # 后台路由
│   │   └── frontend.js     # 前台路由
│   ├── services/           # 业务逻辑层
│   │   ├── cardService.js  # 卡密服务
│   │   ├── orderService.js # 订单服务
│   │   ├── paymentService.js # 支付服务
│   │   ├── productService.js # 商品服务
│   │   ├── statisticsService.js # 统计服务
│   │   └── userService.js  # 用户服务
│   ├── utils/              # 工具类
│   │   ├── database.js     # 数据库封装
│   │   ├── redis.js        # Redis封装
│   │   ├── logger.js       # 日志工具
│   │   ├── response.js     # 响应格式
│   │   └── helpers.js      # 通用工具
│   └── views/              # EJS模板
│       ├── admin/          # 后台页面
│       ├── frontend/       # 前台页面
│       └── layouts/        # 布局模板
├── scripts/
│   ├── init-database.js    # 数据库初始化
│   └── seed-data.js        # 测试数据
├── logs/                   # 日志文件
├── uploads/                # 上传文件
├── package.json
├── .env.example
└── README.md
```

## API 接口

### 公开接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/products | 获取商品列表 |
| GET | /api/products/:id | 获取商品详情 |
| GET | /api/categories | 获取分类列表 |
| POST | /api/orders | 创建订单 |
| GET | /api/orders/query | 查询订单 |
| POST | /api/orders/:orderNo/pay | 发起支付 |
| POST | /api/payment/alipay/notify | 支付宝回调 |

### 管理接口 (需登录)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/login | 管理员登录 |
| POST | /api/auth/logout | 退出登录 |
| GET | /api/admin/products | 商品列表 |
| POST | /api/admin/products | 添加商品 |
| PUT | /api/admin/products/:id | 更新商品 |
| DELETE | /api/admin/products/:id | 删除商品 |
| POST | /api/admin/cards/import | 导入卡密 |
| GET | /api/admin/orders | 订单列表 |
| GET | /api/admin/statistics | 统计数据 |

## 数据库表结构

- `sys_user` - 系统用户表
- `product_category` - 商品分类表
- `product` - 商品表
- `card_import_batch` - 卡密导入批次表
- `card_code` - 卡密表
- `order_main` - 订单主表
- `payment` - 支付记录表
- `delivery` - 发货记录表
- `operation_log` - 操作日志表
- `sys_config` - 系统配置表
- `statistics_daily` - 日统计表

## 开发说明

### 添加新的支付渠道

1. 在 `src/services/paymentService.js` 中添加支付方法
2. 在 `src/routes/api/payment.js` 中添加回调路由
3. 更新前端支付选择界面

### 添加新功能模块

1. 在 `src/services/` 创建业务服务
2. 在 `src/routes/api/` 创建 API 路由
3. 在 `src/views/` 创建页面模板

## 部署说明

### 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start src/app.js --name card-shop

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 安全建议

1. 修改默认管理员密码
2. 使用强随机 SESSION_SECRET
3. 生产环境配置 HTTPS
4. 定期备份数据库
5. 监控服务器日志

## License

MIT License

## 致谢

- [独角数卡](https://github.com/assimon/dujiaoka) - 项目参考
- [Bootstrap](https://getbootstrap.com/) - UI 框架
- [Express.js](https://expressjs.com/) - Web 框架
