/**
 * MySQL 数据库工具类
 * 连接池管理、事务支持、查询封装
 */

const mysql = require('mysql2/promise');
const config = require('../config');
const logger = require('./logger');

class Database {
  constructor() {
    this.pool = null;
    this.init();
  }

  /**
   * 初始化连接池
   */
  init() {
    this.pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      connectionLimit: config.database.connectionLimit,
      waitForConnections: config.database.waitForConnections,
      queueLimit: config.database.queueLimit,
      enableKeepAlive: config.database.enableKeepAlive,
      keepAliveInitialDelay: config.database.keepAliveInitialDelay,
      timezone: config.database.timezone,
      dateStrings: true,
    });

    // 监听连接事件
    this.pool.on('connection', (connection) => {
      logger.debug(`数据库新连接建立: ${connection.threadId}`);
    });
  }

  /**
   * 测试数据库连接
   */
  async testConnection() {
    const connection = await this.pool.getConnection();
    try {
      await connection.ping();
      return true;
    } finally {
      connection.release();
    }
  }

  /**
   * 执行查询
   * @param {string} sql SQL 语句
   * @param {Array} params 参数数组
   * @returns {Promise<Array>} 查询结果
   */
  async query(sql, params = []) {
    const startTime = Date.now();
    try {
      // 使用 query 代替 execute 避免预编译参数类型问题
      const [rows] = await this.pool.query(sql, params);
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        logger.warn(`慢查询警告 (${duration}ms): ${sql}`);
      }
      
      return rows;
    } catch (error) {
      logger.error('数据库查询错误:', { sql, params, error: error.message });
      throw error;
    }
  }

  /**
   * 获取单条记录
   * @param {string} sql SQL 语句
   * @param {Array} params 参数数组
   * @returns {Promise<Object|null>} 单条记录或 null
   */
  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 验证标识符（表名/字段名）是否合法，防止SQL注入
   * @param {string} identifier 标识符
   * @returns {boolean} 是否合法
   */
  isValidIdentifier(identifier) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
  }

  /**
   * 插入数据
   * @param {string} table 表名
   * @param {Object} data 数据对象
   * @returns {Promise<Object>} 插入结果（含 insertId）
   */
  async insert(table, data) {
    // 验证表名
    if (!this.isValidIdentifier(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
    
    const keys = Object.keys(data);
    
    // 验证字段名
    for (const key of keys) {
      if (!this.isValidIdentifier(key)) {
        throw new Error(`Invalid column name: ${key}`);
      }
    }
    
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const escapedKeys = keys.map(k => `\`${k}\``).join(', ');
    
    const sql = `INSERT INTO \`${table}\` (${escapedKeys}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows,
    };
  }

  /**
   * 更新数据
   * @param {string} table 表名
   * @param {Object} data 更新数据
   * @param {Object} where 条件对象
   * @returns {Promise<Object>} 更新结果
   */
  async update(table, data, where) {
    // 验证表名
    if (!this.isValidIdentifier(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
    
    const dataKeys = Object.keys(data);
    const whereKeys = Object.keys(where);
    
    // 验证字段名
    for (const key of [...dataKeys, ...whereKeys]) {
      if (!this.isValidIdentifier(key)) {
        throw new Error(`Invalid column name: ${key}`);
      }
    }
    
    const setClause = dataKeys.map(key => `\`${key}\` = ?`).join(', ');
    const whereClause = whereKeys.map(key => `\`${key}\` = ?`).join(' AND ');
    
    const sql = `UPDATE \`${table}\` SET ${setClause} WHERE ${whereClause}`;
    const params = [...Object.values(data), ...Object.values(where)];
    
    const result = await this.query(sql, params);
    return {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows,
    };
  }

  /**
   * 删除数据
   * @param {string} table 表名
   * @param {Object} where 条件对象
   * @returns {Promise<Object>} 删除结果
   */
  async delete(table, where) {
    // 验证表名
    if (!this.isValidIdentifier(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
    
    const whereKeys = Object.keys(where);
    
    // 验证字段名
    for (const key of whereKeys) {
      if (!this.isValidIdentifier(key)) {
        throw new Error(`Invalid column name: ${key}`);
      }
    }
    
    const whereClause = whereKeys.map(key => `\`${key}\` = ?`).join(' AND ');
    const sql = `DELETE FROM \`${table}\` WHERE ${whereClause}`;
    
    const result = await this.query(sql, Object.values(where));
    return {
      affectedRows: result.affectedRows,
    };
  }

  /**
   * 开始事务
   * @returns {Promise<Object>} 事务连接对象
   */
  async beginTransaction() {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    
    return {
      connection,
      
      async query(sql, params = []) {
        const [rows] = await connection.execute(sql, params);
        return rows;
      },
      
      async queryOne(sql, params = []) {
        const [rows] = await connection.execute(sql, params);
        return rows.length > 0 ? rows[0] : null;
      },
      
      async insert(table, data) {
        // 验证表名
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
          throw new Error(`Invalid table name: ${table}`);
        }
        
        const keys = Object.keys(data);
        
        // 验证字段名
        for (const key of keys) {
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
            throw new Error(`Invalid column name: ${key}`);
          }
        }
        
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');
        const escapedKeys = keys.map(k => `\`${k}\``).join(', ');
        const sql = `INSERT INTO \`${table}\` (${escapedKeys}) VALUES (${placeholders})`;
        const [result] = await connection.execute(sql, values);
        return { insertId: result.insertId, affectedRows: result.affectedRows };
      },
      
      async update(table, data, where) {
        // 验证表名
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
          throw new Error(`Invalid table name: ${table}`);
        }
        
        const dataKeys = Object.keys(data);
        const whereKeys = Object.keys(where);
        
        // 验证字段名
        for (const key of [...dataKeys, ...whereKeys]) {
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
            throw new Error(`Invalid column name: ${key}`);
          }
        }
        
        const setClause = dataKeys.map(key => `\`${key}\` = ?`).join(', ');
        const whereClause = whereKeys.map(key => `\`${key}\` = ?`).join(' AND ');
        const sql = `UPDATE \`${table}\` SET ${setClause} WHERE ${whereClause}`;
        const params = [...Object.values(data), ...Object.values(where)];
        const [result] = await connection.execute(sql, params);
        return { affectedRows: result.affectedRows, changedRows: result.changedRows };
      },
      
      async commit() {
        await connection.commit();
        connection.release();
      },
      
      async rollback() {
        await connection.rollback();
        connection.release();
      },
    };
  }

  /**
   * 在事务中执行回调
   * @param {Function} callback 回调函数
   * @returns {Promise<any>} 回调返回值
   */
  async transaction(callback) {
    const tx = await this.beginTransaction();
    try {
      const result = await callback(tx);
      await tx.commit();
      return result;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  /**
   * 分页查询
   * @param {string} sql 基础 SQL（不含 LIMIT）
   * @param {Array} params 参数
   * @param {number} page 页码
   * @param {number} limit 每页条数
   * @returns {Promise<Object>} 分页结果
   */
  async paginate(sql, params = [], page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const countResult = await this.queryOne(countSql, params);
    const total = countResult.total;
    
    // 获取数据
    const dataSql = `${sql} LIMIT ? OFFSET ?`;
    const data = await this.query(dataSql, [...params, limit, offset]);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 关闭连接池
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('数据库连接池已关闭');
    }
  }
}

// 导出单例
module.exports = new Database();
