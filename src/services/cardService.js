/**
 * 卡密服务层
 */

const db = require('../utils/database');
const redis = require('../utils/redis');
const logger = require('../utils/logger');
const productService = require('./productService');
const { BusinessError } = require('../middlewares/errorHandler');
const { ErrorCodes } = require('../utils/response');

class CardService {
  /**
   * 获取卡密列表（后台）
   */
  async getCardList(params = {}) {
    const { page = 1, limit = 20, product_id, batch_id, status, keyword } = params;
    
    let sql = `
      SELECT c.id, c.product_id, c.batch_id, c.card_code, c.card_secret,
             c.status, c.order_id, c.sold_at, c.void_reason, c.created_at,
             p.name as product_name,
             o.order_no
      FROM card_code c
      LEFT JOIN product p ON c.product_id = p.id
      LEFT JOIN order_main o ON c.order_id = o.id
      WHERE 1=1
    `;
    const sqlParams = [];
    
    if (product_id) {
      sql += ' AND c.product_id = ?';
      sqlParams.push(product_id);
    }
    
    if (batch_id) {
      sql += ' AND c.batch_id = ?';
      sqlParams.push(batch_id);
    }
    
    if (status !== undefined && status !== '') {
      // 转换字符串状态为数字
      const statusMap = { 'available': 0, 'sold': 1, 'void': 2 };
      const statusValue = statusMap[status] !== undefined ? statusMap[status] : parseInt(status);
      sql += ' AND c.status = ?';
      sqlParams.push(statusValue);
    }
    
    if (keyword) {
      sql += ' AND c.card_code LIKE ?';
      sqlParams.push(`%${keyword}%`);
    }
    
    sql += ' ORDER BY c.id DESC';
    
    return await db.paginate(sql, sqlParams, page, limit);
  }
  
  /**
   * 获取商品可用库存数量
   */
  async getAvailableCount(productId) {
    const result = await db.queryOne(
      'SELECT COUNT(*) as count FROM card_code WHERE product_id = ? AND status = 0',
      [productId]
    );
    return result.count;
  }
  
  /**
   * 批量导入卡密
   */
  async importCards(productId, cards, operatorId, fileName = null) {
    // 验证商品是否存在
    const product = await db.queryOne('SELECT id, name FROM product WHERE id = ?', [productId]);
    if (!product) {
      throw new BusinessError(ErrorCodes.PRODUCT_NOT_FOUND);
    }
    
    // 创建导入批次
    const batchResult = await db.insert('card_import_batch', {
      product_id: productId,
      file_name: fileName,
      total_count: cards.length,
      status: 0,
      operator_id: operatorId,
    });
    const batchId = batchResult.insertId;
    
    let successCount = 0;
    let failCount = 0;
    let duplicateCount = 0;
    const failedCards = [];
    
    // 获取已存在的卡密
    const existingCodes = new Set();
    const existingRows = await db.query(
      'SELECT card_code FROM card_code WHERE product_id = ?',
      [productId]
    );
    existingRows.forEach(row => existingCodes.add(row.card_code));
    
    // 本次导入的卡密（用于检测批次内重复）
    const importedCodes = new Set();
    
    // 逐条处理
    for (const card of cards) {
      const cardCode = (card.code || card.card_code || card).toString().trim();
      const cardSecret = card.secret || card.card_secret || null;
      
      // 空值检查
      if (!cardCode) {
        failCount++;
        failedCards.push({ code: cardCode, reason: '卡密为空' });
        continue;
      }
      
      // 重复检查（已存在）
      if (existingCodes.has(cardCode)) {
        duplicateCount++;
        failedCards.push({ code: cardCode, reason: '卡密已存在' });
        continue;
      }
      
      // 重复检查（本批次内）
      if (importedCodes.has(cardCode)) {
        duplicateCount++;
        failedCards.push({ code: cardCode, reason: '批次内重复' });
        continue;
      }
      
      try {
        await db.insert('card_code', {
          product_id: productId,
          batch_id: batchId,
          card_code: cardCode,
          card_secret: cardSecret,
          status: 0,
        });
        
        successCount++;
        importedCodes.add(cardCode);
        existingCodes.add(cardCode);
        
      } catch (error) {
        failCount++;
        failedCards.push({ code: cardCode, reason: error.message });
        logger.error('卡密导入失败:', { cardCode, error: error.message });
      }
    }
    
    // 更新批次记录
    await db.update('card_import_batch', {
      success_count: successCount,
      fail_count: failCount,
      duplicate_count: duplicateCount,
      status: failCount > 0 && successCount === 0 ? 2 : 1,
      remark: failedCards.length > 0 ? JSON.stringify(failedCards.slice(0, 100)) : null,
      completed_at: new Date(),
    }, { id: batchId });
    
    // 更新商品库存
    await productService.updateProductStock(productId);
    
    // 记录操作日志
    await logger.logOperation(operatorId, 'CARD_IMPORT', 'card_import_batch', batchId, {
      product_id: productId,
      product_name: product.name,
      total: cards.length,
      success: successCount,
      fail: failCount,
      duplicate: duplicateCount,
    }, null);
    
    return {
      batch_id: batchId,
      batch_no: batchId,
      total: cards.length,
      imported: successCount,
      success: successCount,
      fail: failCount,
      duplicates: duplicateCount,
      duplicate: duplicateCount,
      failed_cards: failedCards.slice(0, 100), // 最多返回100条失败记录
    };
  }
  
  /**
   * 分配卡密（用于订单发货）
   * 使用事务和行锁确保并发安全
   */
  async allocateCards(productId, quantity, orderId, tx = null) {
    const connection = tx || await db.beginTransaction();
    const shouldCommit = !tx;
    
    try {
      // 使用 FOR UPDATE 锁定指定数量的未售卡密
      const cards = await connection.query(
        `SELECT id, card_code, card_secret 
         FROM card_code 
         WHERE product_id = ? AND status = 0 
         ORDER BY id ASC 
         LIMIT ? 
         FOR UPDATE`,
        [productId, quantity]
      );
      
      if (cards.length < quantity) {
        throw new BusinessError(ErrorCodes.PRODUCT_STOCK_EMPTY);
      }
      
      const cardIds = cards.map(c => parseInt(c.id, 10));
      const now = new Date();
      
      // 更新卡密状态为已售（使用参数化查询防止SQL注入）
      const placeholders = cardIds.map(() => '?').join(',');
      await connection.query(
        `UPDATE card_code 
         SET status = 1, order_id = ?, sold_at = ?, updated_at = ? 
         WHERE id IN (${placeholders})`,
        [orderId, now, now, ...cardIds]
      );
      
      if (shouldCommit) {
        await connection.commit();
      }
      
      return cards;
      
    } catch (error) {
      if (shouldCommit) {
        await connection.rollback();
      }
      throw error;
    }
  }
  
  /**
   * 释放卡密（订单取消时）
   */
  async releaseCards(orderId) {
    await db.query(
      `UPDATE card_code 
       SET status = 0, order_id = NULL, sold_at = NULL 
       WHERE order_id = ? AND status = 1`,
      [orderId]
    );
    
    // 获取商品ID并更新库存
    const card = await db.queryOne(
      'SELECT product_id FROM card_code WHERE order_id = ? LIMIT 1',
      [orderId]
    );
    
    if (card) {
      await productService.updateProductStock(card.product_id);
    }
    
    return true;
  }
  
  /**
   * 作废卡密
   */
  async voidCard(id, reason, operatorId) {
    const card = await db.queryOne('SELECT * FROM card_code WHERE id = ?', [id]);
    
    if (!card) {
      throw new BusinessError(ErrorCodes.CARD_NOT_FOUND);
    }
    
    if (card.status === 1) {
      throw new BusinessError({
        code: 4010,
        message: '已售出的卡密不能作废',
      });
    }
    
    await db.update('card_code', {
      status: 2,
      void_reason: reason,
      void_by: operatorId,
      void_at: new Date(),
    }, { id });
    
    // 更新商品库存
    await productService.updateProductStock(card.product_id);
    
    // 记录日志
    await logger.logOperation(operatorId, 'CARD_VOID', 'card_code', id, {
      product_id: card.product_id,
      card_code: card.card_code.substring(0, 10) + '...',
      reason,
    }, null);
    
    return true;
  }
  
  /**
   * 批量作废卡密
   */
  async voidCards(ids, reason, operatorId) {
    let successCount = 0;
    
    for (const id of ids) {
      try {
        await this.voidCard(id, reason, operatorId);
        successCount++;
      } catch (error) {
        logger.warn(`卡密作废失败: ${id}`, error.message);
      }
    }
    
    return { count: successCount, total: ids.length };
  }
  
  /**
   * 恢复作废的卡密
   */
  async restoreCard(id, operatorId) {
    const card = await db.queryOne('SELECT * FROM card_code WHERE id = ?', [id]);
    
    if (!card) {
      throw new BusinessError(ErrorCodes.CARD_NOT_FOUND);
    }
    
    if (card.status !== 2) {
      throw new BusinessError({
        code: 4011,
        message: '只能恢复已作废的卡密',
      });
    }
    
    await db.update('card_code', {
      status: 0,
      void_reason: null,
      void_by: null,
      void_at: null,
    }, { id });
    
    // 更新商品库存
    await productService.updateProductStock(card.product_id);
    
    // 记录日志
    await logger.logOperation(operatorId, 'CARD_RESTORE', 'card_code', id, {
      product_id: card.product_id,
      card_code: card.card_code.substring(0, 10) + '...',
    }, null);
    
    return true;
  }
  
  /**
   * 批量恢复作废的卡密
   */
  async restoreCards(ids, operatorId) {
    let successCount = 0;
    
    for (const id of ids) {
      try {
        await this.restoreCard(id, operatorId);
        successCount++;
      } catch (error) {
        logger.warn(`卡密恢复失败: ${id}`, error.message);
      }
    }
    
    return { count: successCount, total: ids.length };
  }
  
  /**
   * 删除卡密
   */
  async deleteCard(id, operatorId) {
    const card = await db.queryOne('SELECT * FROM card_code WHERE id = ?', [id]);
    
    if (!card) {
      throw new BusinessError(ErrorCodes.CARD_NOT_FOUND);
    }
    
    if (card.status === 1) {
      throw new BusinessError({
        code: 4010,
        message: '已售出的卡密不能删除',
      });
    }
    
    await db.query('DELETE FROM card_code WHERE id = ?', [id]);
    
    // 更新商品库存
    await productService.updateProductStock(card.product_id);
    
    // 记录日志
    await logger.logOperation(operatorId, 'CARD_DELETE', 'card_code', id, {
      product_id: card.product_id,
      card_code: card.card_code.substring(0, 10) + '...',
    }, null);
    
    return true;
  }
  
  /**
   * 批量删除卡密
   */
  async deleteCards(ids, operatorId) {
    let successCount = 0;
    
    for (const id of ids) {
      try {
        await this.deleteCard(id, operatorId);
        successCount++;
      } catch (error) {
        logger.warn(`卡密删除失败: ${id}`, error.message);
      }
    }
    
    return { count: successCount, total: ids.length };
  }
  
  /**
   * 导出卡密
   */
  async exportCards(params = {}) {
    const { productId, status } = params;
    
    let sql = `
      SELECT c.card_code as card_no, c.card_secret, c.status, c.created_at,
             p.name as product_name,
             CASE c.status
               WHEN 0 THEN '未使用'
               WHEN 1 THEN '已使用'
               WHEN 2 THEN '已作废'
               ELSE '未知'
             END as status_text
      FROM card_code c
      LEFT JOIN product p ON c.product_id = p.id
      WHERE 1=1
    `;
    const sqlParams = [];
    
    if (productId) {
      sql += ' AND c.product_id = ?';
      sqlParams.push(productId);
    }
    
    if (status !== undefined && status !== '' && status !== null) {
      sql += ' AND c.status = ?';
      sqlParams.push(status);
    }
    
    sql += ' ORDER BY c.id ASC LIMIT 10000';
    
    return await db.query(sql, sqlParams);
  }
  
  /**
   * 获取导入批次列表
   */
  async getBatchList(params = {}) {
    const { page = 1, limit = 20, product_id, status } = params;
    
    let sql = `
      SELECT b.*, p.name as product_name, u.username as operator_name
      FROM card_import_batch b
      LEFT JOIN product p ON b.product_id = p.id
      LEFT JOIN sys_user u ON b.operator_id = u.id
      WHERE 1=1
    `;
    const sqlParams = [];
    
    if (product_id) {
      sql += ' AND b.product_id = ?';
      sqlParams.push(product_id);
    }
    
    if (status !== undefined) {
      sql += ' AND b.status = ?';
      sqlParams.push(status);
    }
    
    sql += ' ORDER BY b.id DESC';
    
    return await db.paginate(sql, sqlParams, page, limit);
  }

  /**
   * 获取最近导入批次
   */
  async getRecentBatches(limit = 10) {
    const [rows] = await db.query(
      `SELECT b.id AS batch_no, b.id, b.product_id, b.file_name,
              b.total_count, b.success_count, b.fail_count, b.duplicate_count,
              b.status, b.created_at, p.name AS product_name
       FROM card_import_batch b
       LEFT JOIN product p ON b.product_id = p.id
       ORDER BY b.id DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }
  
  /**
   * 获取订单关联的卡密
   */
  async getCardsByOrderId(orderId) {
    return await db.query(
      `SELECT id, card_code, card_secret, sold_at 
       FROM card_code 
       WHERE order_id = ? AND status = 1 
       ORDER BY id ASC`,
      [orderId]
    );
  }
}

module.exports = new CardService();
