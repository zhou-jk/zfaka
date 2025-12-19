/**
 * 测试数据填充脚本
 */

require('dotenv').config();

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zfaka',
  multipleStatements: true,
};

async function seedData() {
  let connection;
  
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(config);
    
    console.log('正在插入测试数据...');
    
    // 插入测试商品
    const products = [
      {
        name: '网易云音乐VIP月卡',
        code: 'NETEASE_VIP_MONTH',
        category_id: 3,
        description: '网易云音乐黑胶VIP会员月卡，支持无损音质、付费歌曲等特权。',
        price: 15.00,
        original_price: 18.00,
        min_quantity: 1,
        max_quantity: 10,
        status: 1,
        sort_order: 100,
        is_hot: 1,
        is_recommend: 1,
        created_by: 1,
      },
      {
        name: 'Steam 50元充值卡',
        code: 'STEAM_50',
        category_id: 1,
        description: 'Steam 平台 50 元充值卡，可用于购买游戏。',
        price: 48.50,
        original_price: 50.00,
        min_quantity: 1,
        max_quantity: 5,
        status: 1,
        sort_order: 90,
        is_hot: 1,
        created_by: 1,
      },
      {
        name: 'WinRAR 正版授权',
        code: 'WINRAR_LICENSE',
        category_id: 2,
        description: 'WinRAR 6.x 正版授权码，永久有效。',
        price: 29.90,
        min_quantity: 1,
        max_quantity: 3,
        status: 1,
        sort_order: 80,
        created_by: 1,
      },
      {
        name: 'QQ音乐绿钻月卡',
        code: 'QQ_MUSIC_MONTH',
        category_id: 3,
        description: 'QQ音乐绿钻豪华版月卡',
        price: 12.00,
        original_price: 15.00,
        status: 1,
        sort_order: 70,
        created_by: 1,
      },
      {
        name: '腾讯视频VIP月卡',
        code: 'TENCENT_VIDEO_MONTH',
        category_id: 3,
        description: '腾讯视频VIP会员月卡，海量影视免费看',
        price: 19.90,
        original_price: 30.00,
        status: 1,
        sort_order: 85,
        is_recommend: 1,
        created_by: 1,
      },
    ];
    
    for (const product of products) {
      const keys = Object.keys(product);
      const values = Object.values(product);
      const placeholders = keys.map(() => '?').join(', ');
      await connection.execute(
        `INSERT INTO product (${keys.join(', ')}) VALUES (${placeholders})`,
        values
      );
    }
    console.log(`已插入 ${products.length} 个测试商品`);
    
    // 获取商品ID
    const [productRows] = await connection.query('SELECT id, code FROM product');
    const productMap = {};
    productRows.forEach(p => productMap[p.code] = p.id);
    
    // 插入测试卡密
    const cards = [];
    
    // 为每个商品生成一些测试卡密
    for (const product of productRows) {
      for (let i = 1; i <= 20; i++) {
        cards.push({
          product_id: product.id,
          card_code: `${product.code}-${String(i).padStart(4, '0')}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          card_secret: Math.random() > 0.5 ? Math.random().toString(36).substring(2, 10) : null,
          status: 0,
        });
      }
    }
    
    // 批量插入卡密
    for (const card of cards) {
      await connection.execute(
        'INSERT INTO card_code (product_id, card_code, card_secret, status) VALUES (?, ?, ?, ?)',
        [card.product_id, card.card_code, card.card_secret, card.status]
      );
    }
    console.log(`已插入 ${cards.length} 条测试卡密`);
    
    // 更新商品库存缓存
    await connection.query(`
      UPDATE product p 
      SET stock_count = (
        SELECT COUNT(*) FROM card_code c 
        WHERE c.product_id = p.id AND c.status = 0
      )
    `);
    console.log('已更新商品库存');
    
    console.log('\n测试数据填充完成！');
    console.log('每个商品有 20 条可用卡密');
    
  } catch (error) {
    console.error('数据填充失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行填充
seedData();
