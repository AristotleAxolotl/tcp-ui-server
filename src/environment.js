class Environment {
  constructor(config) {
    if (!config) throw new Error("Config must be defined in contructor.");
    if (!config._default)
      throw new Error("Config must also provide a '_default' block.");
    this.env = this._getCfApplication();
    this._config = config;
  }

  // TODO: will eventually be replaced with own method for remote hosting application
  // eslint-disable-next-line class-methods-use-this
  _getCfApplication() {
    if (process.env.LOCAL_DEV) return "local";
    const cfEnv = process.env.VCAP_APPLICATION;
    let cfApp;
    try {
      cfApp = JSON.parse(cfEnv);
    } catch (error) {
      return null;
    }
    return cfApp.space_name;
  }

  getConfigGroup(name) {
    if (!name) return {};

    const defaultOpts = this._getEnvConfig("_default")[name] || {};

    const envOpts = this._getEnvConfig(this.env)[name] || {};

    return { ...defaultOpts, ...envOpts };
  }

  _getEnvConfig(env) {
    return { ...(this._config[env] || {}) };
  }
}

module.exports = Environment;
