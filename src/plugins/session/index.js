// eslint-disable-next-line max-classes-per-file
const uuid = require("uuid");
const cookieParser = require("cookie-parser");
const SessionData = require("./sessionData");
const { LocalBackend, RemoteBackend } = require("./backends/index");

class Session {
  static register(app, instance) {
    app.use(Session._cookieParser(instance.opts.secret));
    app.use(async (req, res, next) => instance._handleRequest(req, res, next));
  }

  static get configGroup() {
    return "session";
  }

  static get loadPriority() {
    return 30;
  }

  async _load(id) {
    if (!id) return this._create();
    try {
      const sessionData = await this._backend.load(id);
      return new Session._SessionData(this, sessionData);
    } catch (e) {
      if (e.code === 404) return this._create();
      throw e;
    }
  }

  async _create() {
    const id = Session._uuid.v4();
    const sessionData = await this._backend.create(id);
    return new Session._SessionData(this, sessionData, true);
  }

  async update(id, data) {
    if (!id) throw new Error("No session id provided for update");
    const sessionData = await this._backend.update(id, data);
    return new Session._SessionData(this, sessionData);
  }

  constructor(opts, envConfig) {
    this.opts = {
      timeout: 60 * 60 * 24,
      name: Session._uuid.v4(),
      secret: Session._uuid.v4(),
      domain: null,
      local: true,
      sessionServer: null,
      ...envConfig,
      ...opts,
    };
  }

  async setup() {
    if (this.opts.local) {
      this._backend = new Session._LocalBackend();
    } else {
      this._backend = new Session._RemoteBackend(this.opts.sessionServer);
    }
    return this._backend.init();
  }

  async _handleRequest(req, res, next) {
    const sessionId = req.signedCookies[this.opts.name];
    const session = await this._load(sessionId);
    if (session.new) {
      res.cookie(this.opts.name, session.id, {
        signed: true,
        domain: this.opts.domain,
      });
    }
    req.session = session;
    return next();
  }
}

module.exports = Session;

Session._uuid = uuid;
Session._cookieParser = cookieParser;
Session._SessionData = SessionData;
Session._RemoteBackend = RemoteBackend;
Session._LocalBackend = LocalBackend;
