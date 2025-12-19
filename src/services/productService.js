/**
 * 商品服务层
 */

const db = require('../utils/database');
const redis = require('../utils/redis');
const logger = require('../utils/logger');
const { BusinessError } = require('../middlewares/errorHandler');
const { ErrorCodes } = require('../utils/response');

// 缓存键前缀
const CACHE_PREFIX = 'product:';
const CACHE_TTL = 300; // 5分钟

class ProductService {
  /**
   * 获取商品列表（前台，只返回上架商品）
   */
  async getProductList(params = {}) {
    const { page = 1, limit = 20, category_id, keyword, is_hot, is_recommend } = params;
    
    let sql = `
      SELECT p.id, p.name, p.code, p.category_id, p.description, p.price, 
             p.original_price, p.stock_count, p.sold_count, p.min_quantity, 
             p.max_quantity, p.image, p.is_hot, p.is_recommend, p.sort_order,
             c.name as category_name
      FROM product p
      LEFT JOIN product_category c ON p.category_id = c.id
      WHERE p.status = 1
    `;
    const sqlParams = [];
    
    if (category_id) {
      sql += ' AND p.category_id = ?';
      sqlParams.push(category_id);
    }
    
    if (keyword) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      sqlParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (is_hot !== undefined) {
      sql += ' AND p.is_hot = ?';
      sqlParams.push(is_hot);
    }
    
    if (is_recommend !== undefined) {
      sql += ' AND p.is_recommend = ?';
      sqlParams.push(is_recommend);
    }
    
    sql += ' ORDER BY p.sort_order DESC, p.id DESC';
    
    return await db.paginate(sql, sqlParams, page, limit);
  }
  
  /**
   * 获取商品列表（后台，返回所有商品）
   */
  async getProductListAdmin(params = {}) {
    const { page = 1, limit = 20, category_id, status, keyword } = params;
    
    let sql = `
      SELECT p.*, c.name as category_name,
             u.username as created_by_name
      FROM product p
      LEFT JOIN product_category c ON p.category_id = c.id
      LEFT JOIN sys_user u ON p.created_by = u.id
      WHERE 1=1
    `;
    const sqlParams = [];
    
    if (category_id) {
      sql += ' AND p.category_id = ?';
      sqlParams.push(category_id);
    }
    
    if (status !== undefined) {
      sql += ' AND p.status = ?';
      sqlParams.push(status);
    }
    
    if (keyword) {
      sql += ' AND (p.name LIKE ? OR p.code LIKE ?)';
      sqlParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    sql += ' ORDER BY p.sort_order DESC, p.id DESC';
    
    return await db.paginate(sql, sqlParams, page, limit);
  }
  
  /**
   * 获取商品详情
   */
  async getProductById(id, includeContent = false) {
    // 尝试从缓存获取
    const cacheKey = `${CACHE_PREFIX}${id}`;
    let product = await redis.get(cacheKey);
    
    if (!product) {
      const fields = includeContent 
        ? 'p.*, c.name as category_name'
        : `p.id, p.name, p.code, p.category_id, p.description, p.price, 
           p.original_price, p.stock_count, p.sold_count, p.min_quantity, 
           p.max_quantity, p.image, p.status, p.is_hot, p.is_recommend,
           c.name as category_name`;
      
      product = await db.queryOne(`
        SELECT ${fields}
        FROM product p
        LEFT JOIN product_category c ON p.category_id = c.id
        WHERE p.id = ?
      `, [id]);
      
      if (product) {
        await redis.set(cacheKey, product, CACHE_TTL);
      }
    }
    
    return product;
  }
  
  /**
   * 获取商品详情（带库存实时查询）
   */
  async getProductWithStock(id) {
    const product = await this.getProductById(id, true);
    
    if (!product) {
      return null;
    }
    
    // 实时查询库存
    const stockResult = await db.queryOne(
      'SELECT COUNT(*) as count FROM card_code WHERE product_id = ? AND status = 0',
      [id]
    );
    product.stock_count = stockResult.count;
    
    return product;
  }
  
  /**
   * 创建商品
   */
  async createProduct(data, operatorId) {
    // 检查商品编码是否重复
    if (data.code) {
      const existing = await db.queryOne(
        'SELECT id FROM product WHERE code = ?',
        [data.code]
      );
      if (existing) {
        throw new BusinessError({
          code: 3010,
          message: '商品编码已存在',
        });
      }
    }
    
    const productData = {
      name: data.name,
      code: data.code || null,
      category_id: data.category_id || 0,
      description: data.description || null,
      content: data.content || null,
      price: data.price,
      original_price: data.original_price || null,
      cost_price: data.cost_price || null,
      min_quantity: data.min_quantity || 1,
      max_quantity: data.max_quantity || 100,
      image: data.image || null,
      status: data.status !== undefined ? data.status : 1,
      sort_order: data.sort_order || 0,
      is_hot: data.is_hot || 0,
      is_recommend: data.is_recommend || 0,
      delivery_type: data.delivery_type || 1,
      created_by: operatorId,
      updated_by: operatorId,
    };
    
    const result = await db.insert('product', productData);
    
    return { id: result.insertId };
  }
  
  /**
   * 更新商品
   */
  async updateProduct(id, data, operatorId) {
    // 检查商品是否存在
    const product = await db.queryOne('SELECT id FROM product WHERE id = ?', [id]);
    if (!product) {
      throw new BusinessError(ErrorCodes.PRODUCT_NOT_FOUND);
    }
    
    // 检查商品编码是否重复
    if (data.code) {
      const existing = await db.queryOne(
        'SELECT id FROM product WHERE code = ? AND id != ?',
        [data.code, id]
      );
      if (existing) {
        throw new BusinessError({
          code: 3010,
          message: '商品编码已存在',
        });
      }
    }
    
    const updateData = { updated_by: operatorId };
    
    const allowedFields = [
      'name', 'code', 'category_id', 'description', 'content', 'price',
      'original_price', 'cost_price', 'min_quantity', 'max_quantity',
      'image', 'status', 'sort_order', 'is_hot', 'is_recommend', 'delivery_type'
    ];
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }
    
    await db.update('product', updateData, { id });
    
    // 清除缓存
    await redis.del(`${CACHE_PREFIX}${id}`);
    
    return true;
  }
  
  /**
   * 删除商品（软删除：下架）
   */
  async deleteProduct(id) {
    const product = await db.queryOne('SELECT id FROM product WHERE id = ?', [id]);
    if (!product) {
      throw new BusinessError(ErrorCodes.PRODUCT_NOT_FOUND);
    }
    
    // 检查是否有未售卡密
    const cardCount = await db.queryOne(
      'SELECT COUNT(*) as count FROM card_code WHERE product_id = ? AND status = 0',
      [id]
    );
    
    if (cardCount.count > 0) {
      throw new BusinessError({
        code: 3011,
        message: `商品还有 ${cardCount.count} 条未售卡密，请先处理`,
      });
    }
    
    await db.update('product', { status: 0 }, { id });
    await redis.del(`${CACHE_PREFIX}${id}`);
    
    return true;
  }
  
  /**
   * 更新商品库存（缓存）
   */
  async updateProductStock(productId) {
    const result = await db.queryOne(
      'SELECT COUNT(*) as count FROM card_code WHERE product_id = ? AND status = 0',
      [productId]
    );
    
    await db.update('product', { stock_count: result.count }, { id: productId });
    await redis.del(`${CACHE_PREFIX}${productId}`);
    
    return result.count;
  }
  
  /**
   * 批量更新商品库存
   */
  async syncAllProductStock() {
    await db.query(`
      UPDATE product p 
      SET stock_count = (
        SELECT COUNT(*) FROM card_code c 
        WHERE c.product_id = p.id AND c.status = 0
      )
    `);
    
    // 清除所有商品缓存
    // 注意：这里简化处理，实际应该获取所有商品ID逐一删除
    logger.info('已同步所有商品库存');
    
    return true;
  }
  
  /**
   * 获取分类列表
   */
  async getCategoryList() {
    const categories = await db.query(
      'SELECT * FROM product_category WHERE status = 1 ORDER BY sort_order DESC, id ASC'
    );
    return categories;
  }
  
  /**
   * 创建分类
   */
  async createCategory(data) {
    const result = await db.insert('product_category', {
      name: data.name,
      parent_id: data.parent_id || 0,
      icon: data.icon || null,
      sort_order: data.sort_order || 0,
      status: 1,
    });
    return { id: result.insertId };
  }
  
  /**
   * 更新分类
   */
  async updateCategory(id, data) {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.parent_id !== undefined) updateData.parent_id = data.parent_id;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
    if (data.status !== undefined) updateData.status = data.status;
    
    return await db.update('product_category', updateData, { id });
  }
  
  /**
   * 删除分类
   */
  async deleteCategory(id) {
    // 检查是否有商品使用该分类
    const productCount = await db.queryOne(
      'SELECT COUNT(*) as count FROM product WHERE category_id = ?',
      [id]
    );
    
    if (productCount.count > 0) {
      throw new BusinessError({
        code: 3020,
        message: `该分类下有 ${productCount.count} 个商品，无法删除`,
      });
    }
    
    await db.delete('product_category', { id });
    return true;
  }
}

module.exports = new ProductService();
