const Proxy = require("../../../proxy");
const BackendError = require("../backendError");

class RemoteBackend {
  constructor(sessionServer) {
    this._sessionServer = sessionServer;
  }

  async init() {
    this._sessionProxy = new RemoteBackend._Proxy();
  }

  async _sessionRequest(method, id, data) {
    this._sessionProxy.setUrl(`${this._sessionServer}/sessions/${id}`);
    try {
      return await this._sessionProxy[method](data);
    } catch (e) {
      throw new RemoteBackend._BackendError(e.message, e.httpStatus);
    }
  }

  async load(id) {
    return this._sessionRequest("get", id);
  }

  async create(id) {
    return this._sessionRequest("post", id);
  }

  async update(id, data) {
    return this._sessionRequest("put", id, data);
  }

  async delete(id) {
    return this._sessionRequest("delete", id);
  }
}

module.exports = RemoteBackend;
RemoteBackend._Proxy = Proxy;
RemoteBackend._BackendError = BackendError;
