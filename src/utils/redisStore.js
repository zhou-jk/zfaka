/**
 * Redis Session Store
 * 用于 express-session 的 Redis 存储适配器
 */

const session = require('express-session');

class RedisStore extends session.Store {
  constructor(options = {}) {
    super();
    this.client = options.client;
    this.prefix = options.prefix || 'sess:';
    this.ttl = options.ttl || 86400; // 默认 24 小时
  }

  /**
   * 获取会话
   */
  async get(sid, callback) {
    try {
      const key = this.prefix + sid;
      const data = await this.client.get(key);
      
      if (!data) {
        return callback(null, null);
      }
      
      let session;
      try {
        session = JSON.parse(data);
      } catch (e) {
        return callback(e);
      }
      
      callback(null, session);
    } catch (err) {
      callback(err);
    }
  }

  /**
   * 设置会话
   */
  async set(sid, session, callback) {
    try {
      const key = this.prefix + sid;
      let ttl = this.ttl;
      
      // 从 cookie 中获取过期时间
      if (session && session.cookie && session.cookie.maxAge) {
        ttl = Math.ceil(session.cookie.maxAge / 1000);
      }
      
      const data = JSON.stringify(session);
      await this.client.setex(key, ttl, data);
      
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  /**
   * 销毁会话
   */
  async destroy(sid, callback) {
    try {
      const key = this.prefix + sid;
      await this.client.del(key);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  /**
   * 刷新会话过期时间
   */
  async touch(sid, session, callback) {
    try {
      const key = this.prefix + sid;
      let ttl = this.ttl;
      
      if (session && session.cookie && session.cookie.maxAge) {
        ttl = Math.ceil(session.cookie.maxAge / 1000);
      }
      
      await this.client.expire(key, ttl);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  /**
   * 获取所有会话数量
   */
  async length(callback) {
    try {
      const keys = await this.client.keys(this.prefix + '*');
      callback(null, keys.length);
    } catch (err) {
      callback(err);
    }
  }

  /**
   * 清除所有会话
   */
  async clear(callback) {
    try {
      const keys = await this.client.keys(this.prefix + '*');
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = RedisStore;
