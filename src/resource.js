class Resource {
  constructor(proxies) {
    this._proxies = proxies;
    Object.keys(this._proxies).forEach((name) => {
      this[name] = this._proxies[name];
    });
  }

  _setProxyMockMode(req) {
    Object.keys(this._proxies).forEach((name) => {
      this._proxies[name].setMockMode(req.mock);
    });
  }

  handler(envConfig) {
    const authConfig = envConfig.getConfigGroup("auth");
    return async (req, res) => {
      if (authConfig.enabled && !req.user) {
        return res.status(401).json({ message: "Not Authorised" });
      }
      this._setProxyMockMode(req);
      const method = req.method.toLowerCase();
      this.req = req;
      this.res = res;
      await Promise.all([
        this._handleRequestAll(),
        this._handleRequestMethod(method),
      ]);
      return this.res.end();
    };
  }

  async _handleRequestMethod(method) {
    if (typeof this[method] !== "function") return Promise.resolve();
    return this[method]();
  }

  async _handleRequestAll() {
    if (typeof this.all !== "function") return Promise.resolve();
    return this.all();
  }

  setConfig(config) {
    this._config = config;
  }

  getConfig() {
    return this._config;
  }

  setEnv(env) {
    this._env = env;
  }

  getEnv() {
    return this._env;
  }
}

module.exports = Resource;
