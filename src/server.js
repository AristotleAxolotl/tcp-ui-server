const express = require("express");

const Logger = require("./logger");

const Environment = require("./environment");

const { nextTick } = require("./lib/timing");

const {
  ConfigInjector,
  Session,
  StaticFiles,
  JsonBodyParser,
  MockRequest,
} = require("./plugins");

class Server {
  constructor(opts, envConfig) {
    const logger = new Server._Logger();
    this.log = logger.log;
    this.error = logger.error;

    this._envConfig = new Server._Environment(envConfig);

    this._opts = {
      port: 5000,
      base: "/api",
      path: "./",
      ...this._envConfig.getConfigGroup("global"),
      ...opts,
    };

    this._plugins = [];
    this._resources = [];

    this._app = Server._express();

    this.addPlugin(JsonBodyParser);
    this.addPlugin(ConfigInjector);
    this.addPlugin(Session);
    this.addPlugin(StaticFiles);
    this.addPlugin(MockRequest);
  }

  getEnvConfig() {
    return this._envConfig;
  }

  async _registerPlugin(Plugin, opts) {
    const plugin = new Plugin(
      opts || {},
      this._envConfig.getConfigGroup(Plugin.configGroup),
      this._opts,
      this._envConfig.getConfigGroup("app"),
      this._envConfig.env
    );
    let wait = true;
    if (typeof plugin.setup === "function") {
      await plugin.setup();
      wait = false;
    }
    if (typeof Plugin.init === "function") {
      await Plugin.init();
      wait = false;
    }
    if (wait) {
      await nextTick();
    }
    if (typeof Plugin.register === "function") {
      this.log(
        `Registering plugin '${Plugin.name}' (${Plugin.loadPriority})...`
      );
      Plugin.register(this._app, plugin, this._opts);
    }
    return Plugin.name;
  }

  async init() {
    await this._registerPlugins((loadPriority) => loadPriority > 0);

    this._registerResources();

    this.log("Registering late chain plugins...");

    await this._registerPlugins((loadPriority) => loadPriority < 0);
  }

  _getSortPlugins() {
    const plugins = [...this._plugins];
    plugins.sort(
      (a, b) => (a.Plugin.loadPriority || 0) - (b.Plugin.loadPriority || 0)
    );
    return plugins;
  }

  async _registerPlugins(loadPriorityFilter) {
    const sortedPlugins = this._getSortPlugins().filter((pl) =>
      loadPriorityFilter(pl.Plugin.loadPriority)
    );
    const registeredPlugins = [];
    for (const pl of sortedPlugins) {
      const { Plugin, opts } = pl;
      // eslint-disable-next-line no-await-in-loop
      const pluginName = await this._registerPlugin(Plugin, opts);
      registeredPlugins.push(pluginName);
    }
    return registeredPlugins;
  }

  _registerResources() {
    this.log("Setting up API routes...");

    const apiBase = Server._express.Router();
    for (const r of this._resources) {
      const { Resource, proxies } = r;
      const res = new Resource(proxies);
      res.setConfig(this._envConfig.getConfigGroup("app"));
      res.setEnv(this._envConfig.env);
      if (Resource.path) {
        this.log(`Attaching '${Resource.name}' to path: ${Resource.path}`);
        apiBase.use(Resource.path, res.handler(this._envConfig));
      } else {
        throw new Error(`${Resource.name} needs a path!`);
      }
    }
    this._app.use(this._opts.base, apiBase);
  }

  addResource(Resource, proxies) {
    this._resources.push({ Resource, proxies });
  }

  addPlugin(Plugin, opts) {
    this._plugins.push({ Plugin, opts });
  }

  clearPlugins() {
    this._plugins = [];
  }

  clearResources() {
    this._resources = [];
  }

  async listen() {
    await this._app.listen(this._opts.port);
    this.log(`Server listening on port ${this._opts.port}`);
  }
}

module.exports = Server;

Server._Logger = Logger;
Server._express = express;
Server._Environment = Environment;
