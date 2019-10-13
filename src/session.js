const uuid = require('uuid');
const crypto = require('crypto');

module.exports = class Session {
  constructor(clientIp = '') {
    this.id = crypto
      .createHash('sha256')
      .update(`${uuid.v4()}-${clientIp}`)
      .digest('hex');
    this.data = new Map();
  }

  get(key) {
    return this.data.get(key);
  }

  set(key, value) {
    return this.data.set(key, value);
  }

  has(key) {
    return this.data.has(key);
  }

  delete(key) {
    return this.data.delete(key);
  }
};
