module.exports = class Resource {
  handler() {
    return async (req, res) => {
      const method = req.method.toLowerCase();
      this.req = req;
      this.res = res;
      await Promise.all([this._handleRequestAll(), this._handleRequestMethod(method)]);
      return this.res.end();
    };
  }

  async _handleRequestMethod(method) {
    if (typeof this[method] !== 'function') return Promise.resolve();
    return this[method]();
  }

  async _handleRequestAll() {
    if (typeof this.all !== 'function') return Promise.resolve();
    return this.all();
  }
};
