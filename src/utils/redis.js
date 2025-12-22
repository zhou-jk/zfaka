/**
 * Redis 工具类
 * 缓存管理、分布式锁、会话存储
 */

const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.init();
  }

  /**
   * 初始化 Redis 连接
   */
  init() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      keyPrefix: config.redis.keyPrefix,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis 连接重试次数过多，停止重试');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    this.client.on('connect', () => {
      logger.debug('Redis 连接中...');
    });

    this.client.on('ready', () => {
      logger.info('Redis 连接就绪');
    });

    this.client.on('error', (err) => {
      logger.error('Redis 连接错误:', err);
    });

    this.client.on('close', () => {
      logger.warn('Redis 连接已关闭');
    });
  }

  /**
   * 获取原始客户端
   */
  getClient() {
    return this.client;
  }

  /**
   * 测试连接
   */
  async testConnection() {
    const result = await this.client.ping();
    return result === 'PONG';
  }

  /**
   * 设置缓存
   * @param {string} key 键
   * @param {any} value 值
   * @param {number} ttl 过期时间（秒），可选
   */
  async set(key, value, ttl = null) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  /**
   * 获取缓存
   * @param {string} key 键
   * @param {boolean} parse 是否解析 JSON
   * @returns {Promise<any>} 值
   */
  async get(key, parse = true) {
    const value = await this.client.get(key);
    if (value === null) {return null;}
    if (parse) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }

  /**
   * 删除缓存
   * @param {string} key 键
   */
  async del(...keys) {
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  /**
   * 获取匹配的所有键
   * @param {string} pattern 模式
   */
  async keys(pattern) {
    return await this.client.keys(pattern);
  }

  /**
   * 检查键是否存在
   * @param {string} key 键
   */
  async exists(key) {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * 设置过期时间
   * @param {string} key 键
   * @param {number} seconds 秒数
   */
  async expire(key, seconds) {
    await this.client.expire(key, seconds);
  }

  /**
   * 自增
   * @param {string} key 键
   * @param {number} increment 增量
   */
  async incr(key, increment = 1) {
    if (increment === 1) {
      return await this.client.incr(key);
    }
    return await this.client.incrby(key, increment);
  }

  /**
   * 自减
   * @param {string} key 键
   * @param {number} decrement 减量
   */
  async decr(key, decrement = 1) {
    if (decrement === 1) {
      return await this.client.decr(key);
    }
    return await this.client.decrby(key, decrement);
  }

  /**
   * 获取分布式锁
   * @param {string} lockKey 锁键
   * @param {number} ttl 锁过期时间（秒）
   * @param {string} value 锁值（用于释放时验证）
   * @returns {Promise<boolean>} 是否成功获取锁
   */
  async acquireLock(lockKey, ttl = 30, value = null) {
    const lockValue = value || `${Date.now()}-${Math.random()}`;
    const result = await this.client.set(
      `lock:${lockKey}`,
      lockValue,
      'EX',
      ttl,
      'NX',
    );
    if (result === 'OK') {
      return { success: true, value: lockValue };
    }
    return { success: false, value: null };
  }

  /**
   * 释放分布式锁
   * @param {string} lockKey 锁键
   * @param {string} value 锁值
   */
  async releaseLock(lockKey, value) {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.client.eval(script, 1, `lock:${lockKey}`, value);
    return result === 1;
  }

  /**
   * 添加到集合
   * @param {string} key 键
   * @param {string|string[]} members 成员
   */
  async sadd(key, members) {
    if (Array.isArray(members)) {
      await this.client.sadd(key, ...members);
    } else {
      await this.client.sadd(key, members);
    }
  }

  /**
   * 检查是否在集合中
   * @param {string} key 键
   * @param {string} member 成员
   */
  async sismember(key, member) {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  /**
   * 哈希表操作
   */
  async hset(key, field, value) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.hset(key, field, serialized);
  }

  async hget(key, field, parse = true) {
    const value = await this.client.hget(key, field);
    if (value === null) {return null;}
    if (parse) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }

  async hgetall(key, parse = true) {
    const data = await this.client.hgetall(key);
    if (!data || Object.keys(data).length === 0) {return null;}
    if (parse) {
      const result = {};
      for (const [field, value] of Object.entries(data)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result;
    }
    return data;
  }

  async hdel(key, field) {
    await this.client.hdel(key, field);
  }

  /**
   * 关闭连接
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis 连接已关闭');
    }
  }
}

// 导出单例
module.exports = new RedisClient();
