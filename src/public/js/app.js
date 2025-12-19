/* 自动售货系统前端脚本 */

// API 请求封装
const api = {
  async request(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(data.message || '请求失败');
    }

    return data.data;
  },

  get(url) {
    return this.request(url);
  },

  post(url, body) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(url, body) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(url) {
    return this.request(url, { method: 'DELETE' });
  },
};

// 工具函数
const utils = {
  // 格式化金额
  formatMoney(amount) {
    return '¥' + parseFloat(amount || 0).toFixed(2);
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  },

  // 复制到剪贴板
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('已复制到剪贴板');
      return true;
    } catch (err) {
      console.error('复制失败:', err);
      return false;
    }
  },

  // 显示提示
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed fade show`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 200px;';
    toast.innerHTML = `
      ${message}
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  // 确认对话框
  confirm(message) {
    return window.confirm(message);
  },

  // 防抖
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 节流
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
};

// 订单相关
const order = {
  // 创建订单
  async create(productId, quantity, email) {
    return api.post('/api/orders', {
      product_id: productId,
      quantity: quantity,
      email: email || undefined,
    });
  },

  // 发起支付
  async pay(orderNo, channel) {
    return api.post(`/api/orders/${orderNo}/pay`, {
      pay_channel: channel,
    });
  },

  // 查询订单
  async query(params) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/api/orders/query?${queryString}`);
  },

  // 获取订单状态
  async getStatus(orderNo) {
    return api.get(`/api/orders/${orderNo}/status`);
  },
};

// 商品相关
const product = {
  // 获取商品列表
  async list(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/api/products?${queryString}`);
  },

  // 获取商品详情
  async detail(id) {
    return api.get(`/api/products/${id}`);
  },

  // 获取分类列表
  async categories() {
    return api.get('/api/categories');
  },
};

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
  // 初始化工具提示
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(el => new bootstrap.Tooltip(el));

  // 初始化弹出框
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(el => new bootstrap.Popover(el));
});

// 导出到全局
window.api = api;
window.utils = utils;
window.order = order;
window.product = product;
