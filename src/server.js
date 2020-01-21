/* eslint-disable no-console */
const express = require('express');
const cookieParser = require('cookie-parser');
const uuid = require('uuid');
const path = require('path');

const Session = require('./session');

module.exports = class Server {
  constructor(opts) {
    this.opts = {
      port: 5000,
      session: false,
      sessionTimeout: 60 * 60 * 24,
      sessionName: uuid.v4(),
      sessionSecret: uuid.v4(),
      base: '/api',
      path: './',
      ...opts,
    };

    this.sessions = new Map();
    this.sessionName = uuid.v4();
    this.sessionSecret = uuid.v4();

    this.resources = new Set();

    this.app = express();
  }

  handleSessions(req, res, next) {
    const sessionId = req.signedCookies[this.opts.sessionName];
    let session = this.sessions.get(sessionId);
    if (!sessionId || !session) {
      session = new Session(req.ip);
      this.sessions.set(session.id, session);
    }
    res.cookie(this.opts.sessionName, session.id, {
      maxAge: this.opts.sessionTimeout,
      signed: true,
    });
    req.session = session;
    next();
  }

  init() {
    if (this.opts.path) this.app.use(express.static(this.opts.path));

    this.app.use(cookieParser(this.opts.sessionSecret));
    this.app.use(express.json());
    if (this.opts.session) this.app.use(this.handleSessions.bind(this));

    const apiBase = express.Router();

    this.resources.forEach(r => {
      const { Resource, args } = r;
      const res = new Resource(...args);
      if (Resource.path) {
        console.log('Attaching resource to path: ', Resource.path);
        apiBase.use(Resource.path, res.handler());
      } else {
        apiBase.use(res.handler());
      }
    });

    this.app.use(this.opts.base, apiBase);

    if (this.opts.path) {
      this.app.get('/*', (req, res) => {
        res.sendFile(path.resolve(this.opts.path, 'index.html'));
      });
    }
  }

  add(Resource, ...constructorArgs) {
    this.resources.add({ Resource, args: constructorArgs });
  }

  listen() {
    this.app.listen(this.opts.port, () =>
      console.log(`Server listening on port ${this.opts.port}`),
    );
  }
};
