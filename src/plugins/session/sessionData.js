class SessionData {
  constructor(sessionPlugin, sData, newSession = false) {
    this.id = sData.id;
    this.data = { ...sData.data };
    this.new = newSession;
    this._sessionPlugin = sessionPlugin;
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this._sessionPlugin.update(this.id, this.data);
  }

  has(key) {
    return key in this.data;
  }

  delete(key) {
    delete this.data[key];
    this._sessionPlugin.update(this.id, this.data);
  }
}

module.exports = SessionData;