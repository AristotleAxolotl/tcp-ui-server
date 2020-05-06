const Logger = require("../logger");

class MockRequest {
    constructor(opts, envConfig) {
      this._opts = {
          secret : 'secret',
        ...envConfig,
        ...opts
      };
    }

    async setup(){
        const logger = new MockRequest._Logger();
        this.log = logger.log;
        this.error = logger.error;
    }
  
    static get configGroup() {
      return "mock-request";
    }
  
    static get loadPriority() {
      return 5;
    }
  
    static register(app, instance) {
      app.use(instance._handleRequest.bind(instance));
    }
  
    async _handleRequest(req, res, next) {
      req.mock = false;
      if (MockRequest._MOCK || req.get('x-mock-request') === this._opts.secret) req.mock = true;
      if (req.mock && !req.path.match(/\.js$/)) this.log(` - Mocking request: ${req.method} ${req.path}`);
      return next();
    }
  }
  
  module.exports = MockRequest;
  MockRequest._MOCK = process.env.MOCK;
  MockRequest._Logger = Logger;