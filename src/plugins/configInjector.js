const fse = require("fs-extra");
const path = require("path");

const Logger = require("../logger");

function indexTemplate(env, config) {
  return `<script>
        window.ENV = "${env || "unknown"}";
        window.ENV_CONFIG = ${JSON.stringify(config)};
    </script>`;
}

class ConfigInjector {
  static register(app, instance) {
    app.get('/*', instance._handleRequest.bind(instance));
  }

  static get configGroup() {
    return "config-injector";
  }

  static get loadPriority() {
    return -1;
  }

  // eslint-disable-next-line max-params
  constructor(opts, envConfig, serverOpts, appConfig, serverEnv) {
    const logger = new ConfigInjector._Logger();
    this.log = logger.log;
    this.error = logger.error;

    this._opts = {
      ...envConfig,
      ...opts,
      serverOpts,
      appConfig,
      serverEnv
    };
  }

  async _handleRequest(req, res, next) {
    let index;
    try {
      index = await ConfigInjector._fse.readFile(
        ConfigInjector._path.resolve(this._opts.serverOpts.path, "_index.html"),
        "utf8"
      );
    } catch (e) {
      if (e.code !== "ENOENT") {
        this.log("Error reading JS file to _index.html.");
        this.error(e);
      }
      // eslint-disable-next-line consistent-return
      return next();
    }
    const out = index.replace(
      "<meta env-config />",
      indexTemplate(this._opts.serverEnv, this._opts.appConfig)
    );
    res.type("html");
    return res.send(out);
  }
}

module.exports = ConfigInjector;

ConfigInjector._fse = fse;
ConfigInjector._path = path;
ConfigInjector._Logger = Logger;