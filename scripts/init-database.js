/**
 * 数据库初始化脚本
 * 创建所有表结构
 */

require('dotenv').config();

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

const DB_NAME = process.env.DB_NAME || 'zfaka';

// SQL 建表语句
const createTableSQL = `
-- =====================================================
-- 自动售货系统数据库结构
-- =====================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE \`${DB_NAME}\`;

-- =====================================================
-- 1. 系统用户表 (管理员/买家)
-- =====================================================
DROP TABLE IF EXISTS \`sys_user\`;
CREATE TABLE \`sys_user\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  \`username\` VARCHAR(50) NOT NULL COMMENT '登录名',
  \`password_hash\` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  \`role\` TINYINT NOT NULL DEFAULT 2 COMMENT '角色: 1=管理员, 2=买家',
  \`email\` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  \`phone\` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  \`avatar\` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
  \`last_login_at\` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  \`last_login_ip\` VARCHAR(45) DEFAULT NULL COMMENT '最后登录IP',
  \`login_count\` INT UNSIGNED DEFAULT 0 COMMENT '登录次数',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_username\` (\`username\`),
  KEY \`idx_email\` (\`email\`),
  KEY \`idx_role_status\` (\`role\`, \`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户表';

-- =====================================================
-- 2. 商品表
-- =====================================================
DROP TABLE IF EXISTS \`product\`;
CREATE TABLE \`product\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  \`name\` VARCHAR(100) NOT NULL COMMENT '商品名称',
  \`code\` VARCHAR(50) DEFAULT NULL COMMENT '商品编码',
  \`category_id\` INT UNSIGNED DEFAULT 0 COMMENT '分类ID',
  \`description\` TEXT COMMENT '商品描述',
  \`content\` TEXT COMMENT '商品详情(富文本)',
  \`price\` DECIMAL(10,2) NOT NULL COMMENT '单价(元)',
  \`original_price\` DECIMAL(10,2) DEFAULT NULL COMMENT '原价',
  \`cost_price\` DECIMAL(10,2) DEFAULT NULL COMMENT '成本价',
  \`stock_count\` INT UNSIGNED DEFAULT 0 COMMENT '库存数量(缓存)',
  \`sold_count\` INT UNSIGNED DEFAULT 0 COMMENT '销量(缓存)',
  \`min_quantity\` INT UNSIGNED DEFAULT 1 COMMENT '最小购买数量',
  \`max_quantity\` INT UNSIGNED DEFAULT 100 COMMENT '最大购买数量',
  \`image\` VARCHAR(255) DEFAULT NULL COMMENT '商品图片',
  \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0=下架, 1=上架',
  \`sort_order\` INT DEFAULT 0 COMMENT '排序值(越大越靠前)',
  \`is_hot\` TINYINT DEFAULT 0 COMMENT '是否热门: 0=否, 1=是',
  \`is_recommend\` TINYINT DEFAULT 0 COMMENT '是否推荐: 0=否, 1=是',
  \`delivery_type\` TINYINT DEFAULT 1 COMMENT '发货类型: 1=自动发卡, 2=手动发货',
  \`created_by\` INT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
  \`updated_by\` INT UNSIGNED DEFAULT NULL COMMENT '更新人ID',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_code\` (\`code\`),
  KEY \`idx_category\` (\`category_id\`),
  KEY \`idx_status_sort\` (\`status\`, \`sort_order\` DESC),
  KEY \`idx_hot_recommend\` (\`is_hot\`, \`is_recommend\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- =====================================================
-- 3. 商品分类表
-- =====================================================
DROP TABLE IF EXISTS \`product_category\`;
CREATE TABLE \`product_category\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  \`name\` VARCHAR(50) NOT NULL COMMENT '分类名称',
  \`parent_id\` INT UNSIGNED DEFAULT 0 COMMENT '父分类ID',
  \`icon\` VARCHAR(100) DEFAULT NULL COMMENT '图标',
  \`sort_order\` INT DEFAULT 0 COMMENT '排序值',
  \`status\` TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=启用',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_parent\` (\`parent_id\`),
  KEY \`idx_sort\` (\`sort_order\` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品分类表';

-- =====================================================
-- 4. 卡密导入批次表
-- =====================================================
DROP TABLE IF EXISTS \`card_import_batch\`;
CREATE TABLE \`card_import_batch\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '批次ID',
  \`product_id\` INT UNSIGNED NOT NULL COMMENT '商品ID',
  \`file_name\` VARCHAR(255) DEFAULT NULL COMMENT '上传文件名',
  \`total_count\` INT UNSIGNED DEFAULT 0 COMMENT '导入总数',
  \`success_count\` INT UNSIGNED DEFAULT 0 COMMENT '成功数量',
  \`fail_count\` INT UNSIGNED DEFAULT 0 COMMENT '失败数量',
  \`duplicate_count\` INT UNSIGNED DEFAULT 0 COMMENT '重复数量',
  \`status\` TINYINT DEFAULT 0 COMMENT '状态: 0=处理中, 1=完成, 2=失败',
  \`remark\` TEXT COMMENT '备注/错误说明',
  \`operator_id\` INT UNSIGNED NOT NULL COMMENT '操作人ID',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`completed_at\` DATETIME DEFAULT NULL COMMENT '完成时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_product\` (\`product_id\`),
  KEY \`idx_operator\` (\`operator_id\`),
  KEY \`idx_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡密导入批次表';

-- =====================================================
-- 5. 卡密表
-- =====================================================
DROP TABLE IF EXISTS \`card_code\`;
CREATE TABLE \`card_code\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '卡密ID',
  \`product_id\` INT UNSIGNED NOT NULL COMMENT '商品ID',
  \`batch_id\` INT UNSIGNED DEFAULT NULL COMMENT '导入批次ID',
  \`card_code\` VARCHAR(500) NOT NULL COMMENT '卡密内容',
  \`card_secret\` VARCHAR(255) DEFAULT NULL COMMENT '附加密码',
  \`status\` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0=未售, 1=已售, 2=作废, 3=锁定中',
  \`order_id\` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联订单ID',
  \`sold_at\` DATETIME DEFAULT NULL COMMENT '售出时间',
  \`void_reason\` VARCHAR(255) DEFAULT NULL COMMENT '作废原因',
  \`void_by\` INT UNSIGNED DEFAULT NULL COMMENT '作废操作人',
  \`void_at\` DATETIME DEFAULT NULL COMMENT '作废时间',
  \`remark\` VARCHAR(255) DEFAULT NULL COMMENT '备注',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_product_status\` (\`product_id\`, \`status\`),
  KEY \`idx_batch\` (\`batch_id\`),
  KEY \`idx_order\` (\`order_id\`),
  KEY \`idx_status\` (\`status\`),
  KEY \`idx_created\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡密表';

-- =====================================================
-- 6. 订单主表
-- =====================================================
DROP TABLE IF EXISTS \`order_main\`;
CREATE TABLE \`order_main\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  \`order_no\` VARCHAR(32) NOT NULL COMMENT '订单号',
  \`buyer_id\` INT UNSIGNED DEFAULT NULL COMMENT '买家ID',
  \`buyer_email\` VARCHAR(100) DEFAULT NULL COMMENT '买家邮箱',
  \`buyer_phone\` VARCHAR(20) DEFAULT NULL COMMENT '买家手机',
  \`product_id\` INT UNSIGNED NOT NULL COMMENT '商品ID',
  \`product_name\` VARCHAR(100) NOT NULL COMMENT '商品名称(快照)',
  \`quantity\` INT UNSIGNED NOT NULL COMMENT '购买数量',
  \`unit_price\` DECIMAL(10,2) NOT NULL COMMENT '下单时单价(快照)',
  \`total_amount\` DECIMAL(10,2) NOT NULL COMMENT '应付金额',
  \`paid_amount\` DECIMAL(10,2) DEFAULT NULL COMMENT '实付金额',
  \`currency\` VARCHAR(10) DEFAULT 'CNY' COMMENT '币种',
  \`order_status\` TINYINT NOT NULL DEFAULT 0 COMMENT '订单状态: 0=待支付, 1=支付中, 2=已支付待发货, 3=已完成, 4=待人工处理, 5=已取消, 6=已退款',
  \`pay_channel\` VARCHAR(20) DEFAULT NULL COMMENT '支付渠道',
  \`pay_time\` DATETIME DEFAULT NULL COMMENT '支付时间',
  \`delivery_status\` TINYINT DEFAULT 0 COMMENT '发货状态: 0=未发货, 1=已发货, 2=发货失败',
  \`delivery_time\` DATETIME DEFAULT NULL COMMENT '发货时间',
  \`expire_time\` DATETIME DEFAULT NULL COMMENT '订单过期时间',
  \`client_ip\` VARCHAR(45) DEFAULT NULL COMMENT '下单IP',
  \`user_agent\` VARCHAR(500) DEFAULT NULL COMMENT '用户代理',
  \`remark\` TEXT COMMENT '备注',
  \`admin_remark\` TEXT COMMENT '管理员备注',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  \`closed_at\` DATETIME DEFAULT NULL COMMENT '关闭时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_order_no\` (\`order_no\`),
  KEY \`idx_buyer_email\` (\`buyer_email\`),
  KEY \`idx_product\` (\`product_id\`),
  KEY \`idx_status\` (\`order_status\`),
  KEY \`idx_pay_channel\` (\`pay_channel\`),
  KEY \`idx_created\` (\`created_at\`),
  KEY \`idx_expire\` (\`expire_time\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单主表';

-- =====================================================
-- 7. 支付记录表
-- =====================================================
DROP TABLE IF EXISTS \`payment\`;
CREATE TABLE \`payment\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '支付记录ID',
  \`order_id\` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  \`order_no\` VARCHAR(32) NOT NULL COMMENT '订单号',
  \`pay_no\` VARCHAR(64) NOT NULL COMMENT '内部支付流水号',
  \`pay_channel\` VARCHAR(20) NOT NULL COMMENT '支付渠道: alipay/wechat/manual',
  \`pay_status\` TINYINT NOT NULL DEFAULT 0 COMMENT '支付状态: 0=待支付, 1=支付成功, 2=支付失败, 3=已退款',
  \`request_amount\` DECIMAL(10,2) NOT NULL COMMENT '请求支付金额',
  \`paid_amount\` DECIMAL(10,2) DEFAULT NULL COMMENT '实际支付金额',
  \`currency\` VARCHAR(10) DEFAULT 'CNY' COMMENT '币种',
  \`platform_trade_no\` VARCHAR(64) DEFAULT NULL COMMENT '第三方交易号',
  \`platform_buyer_id\` VARCHAR(64) DEFAULT NULL COMMENT '第三方买家ID',
  \`pay_url\` TEXT COMMENT '支付链接',
  \`qr_code\` TEXT COMMENT '支付二维码',
  \`notify_status\` TINYINT DEFAULT 0 COMMENT '回调状态: 0=未收到, 1=已处理, 2=处理失败',
  \`notify_time\` DATETIME DEFAULT NULL COMMENT '回调时间',
  \`notify_count\` INT DEFAULT 0 COMMENT '回调次数',
  \`notify_raw\` TEXT COMMENT '回调原始数据',
  \`error_msg\` VARCHAR(500) DEFAULT NULL COMMENT '错误信息',
  \`expired_at\` DATETIME DEFAULT NULL COMMENT '支付过期时间',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_pay_no\` (\`pay_no\`),
  KEY \`idx_order\` (\`order_id\`),
  KEY \`idx_order_no\` (\`order_no\`),
  KEY \`idx_platform_trade\` (\`platform_trade_no\`),
  KEY \`idx_status\` (\`pay_status\`),
  KEY \`idx_channel\` (\`pay_channel\`),
  KEY \`idx_created\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';

-- =====================================================
-- 8. 发货记录表
-- =====================================================
DROP TABLE IF EXISTS \`delivery\`;
CREATE TABLE \`delivery\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '发货记录ID',
  \`order_id\` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  \`order_no\` VARCHAR(32) NOT NULL COMMENT '订单号',
  \`card_id\` BIGINT UNSIGNED NOT NULL COMMENT '卡密ID',
  \`card_code\` VARCHAR(500) NOT NULL COMMENT '卡密内容',
  \`card_secret\` VARCHAR(255) DEFAULT NULL COMMENT '附加密码',
  \`delivery_type\` TINYINT DEFAULT 1 COMMENT '发货类型: 1=自动, 2=手动补发',
  \`operator_id\` INT UNSIGNED DEFAULT NULL COMMENT '操作人(手动发货时)',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发货时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_order\` (\`order_id\`),
  KEY \`idx_order_no\` (\`order_no\`),
  KEY \`idx_card\` (\`card_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发货记录表';

-- =====================================================
-- 9. 操作日志表
-- =====================================================
DROP TABLE IF EXISTS \`operation_log\`;
CREATE TABLE \`operation_log\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  \`operator_id\` INT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  \`operator_name\` VARCHAR(50) DEFAULT NULL COMMENT '操作人名称',
  \`op_type\` VARCHAR(50) NOT NULL COMMENT '操作类型',
  \`target_type\` VARCHAR(50) DEFAULT NULL COMMENT '目标类型',
  \`target_id\` VARCHAR(64) DEFAULT NULL COMMENT '目标ID',
  \`content\` JSON COMMENT '操作详情',
  \`ip\` VARCHAR(45) DEFAULT NULL COMMENT '操作IP',
  \`user_agent\` VARCHAR(500) DEFAULT NULL COMMENT '用户代理',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_operator\` (\`operator_id\`),
  KEY \`idx_op_type\` (\`op_type\`),
  KEY \`idx_target\` (\`target_type\`, \`target_id\`),
  KEY \`idx_created\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- =====================================================
-- 10. 系统配置表
-- =====================================================
DROP TABLE IF EXISTS \`sys_config\`;
CREATE TABLE \`sys_config\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  \`config_key\` VARCHAR(100) NOT NULL COMMENT '配置键',
  \`config_value\` TEXT COMMENT '配置值',
  \`config_type\` VARCHAR(20) DEFAULT 'string' COMMENT '值类型: string/number/boolean/json',
  \`description\` VARCHAR(255) DEFAULT NULL COMMENT '配置说明',
  \`is_public\` TINYINT DEFAULT 0 COMMENT '是否公开: 0=否, 1=是',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_config_key\` (\`config_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- =====================================================
-- 11. 统计数据表(日汇总)
-- =====================================================
DROP TABLE IF EXISTS \`statistics_daily\`;
CREATE TABLE \`statistics_daily\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  \`stat_date\` DATE NOT NULL COMMENT '统计日期',
  \`order_count\` INT UNSIGNED DEFAULT 0 COMMENT '订单数',
  \`paid_order_count\` INT UNSIGNED DEFAULT 0 COMMENT '已支付订单数',
  \`total_amount\` DECIMAL(12,2) DEFAULT 0.00 COMMENT '总金额',
  \`paid_amount\` DECIMAL(12,2) DEFAULT 0.00 COMMENT '已支付金额',
  \`card_sold_count\` INT UNSIGNED DEFAULT 0 COMMENT '卡密销售数',
  \`card_import_count\` INT UNSIGNED DEFAULT 0 COMMENT '卡密导入数',
  \`new_user_count\` INT UNSIGNED DEFAULT 0 COMMENT '新用户数',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_stat_date\` (\`stat_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日统计表';

-- =====================================================
-- 初始化默认数据
-- =====================================================

-- 默认管理员账号将通过代码动态创建

-- 默认分类
INSERT INTO \`product_category\` (\`name\`, \`sort_order\`, \`status\`) VALUES
('游戏点卡', 100, 1),
('软件激活', 90, 1),
('会员充值', 80, 1),
('其他', 0, 1);

-- 默认系统配置
INSERT INTO \`sys_config\` (\`config_key\`, \`config_value\`, \`config_type\`, \`description\`, \`is_public\`) VALUES
('site_name', '自动售货系统', 'string', '网站名称', 1),
('site_description', '安全、快捷的数字商品自动售卖平台', 'string', '网站描述', 1),
('site_keywords', '自动发卡,卡密销售,数字商品', 'string', '网站关键词', 1),
('order_expire_minutes', '30', 'number', '订单过期时间(分钟)', 0),
('min_order_amount', '0.01', 'number', '最小订单金额', 0),
('max_order_amount', '10000', 'number', '最大订单金额', 0),
('enable_email_notify', 'false', 'boolean', '是否启用邮件通知', 0),
('contact_email', 'support@example.com', 'string', '联系邮箱', 1),
('contact_qq', '', 'string', '联系QQ', 1);

`;

async function initDatabase() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(config);
    
    console.log('正在创建数据库和表...');
    await connection.query(createTableSQL);
    
    // 动态生成密码哈希并创建管理员账号
    console.log('正在创建默认管理员账号...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    await connection.query(
      `INSERT INTO \`${DB_NAME}\`.\`sys_user\` (\`username\`, \`password_hash\`, \`role\`, \`email\`, \`status\`) VALUES (?, ?, 1, 'admin@example.com', 1) ON DUPLICATE KEY UPDATE password_hash = ?`,
      ['admin', passwordHash, passwordHash]
    );
    
    console.log('\n========================================');
    console.log('数据库初始化成功！');
    console.log(`数据库名: ${DB_NAME}`);
    console.log('默认管理员账号: admin');
    console.log('默认管理员密码: admin123');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行初始化
initDatabase();
