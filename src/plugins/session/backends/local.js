/* eslint-disable sonarjs/no-duplicate-string */
const sqlite = require("sqlite");
const BackendError = require("../backendError");

class LocalBackend {
  async init() {
    try {
      this._db = await LocalBackend._sqlite.open(":memory:", { Promise });
      return this._db.run(
        "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, data TEXT);"
      );
    } catch (e) {
      throw new LocalBackend._BackendError(e.message);
    }
  }

  async load(id) {
    if (!id) throw new LocalBackend._BackendError('Invalid session ID', 400);
    const sessionData = await this._db.get(
      "SELECT data from sessions where id = ?",
      id
    );
    if (!sessionData) throw new LocalBackend._BackendError('No session found', 404);
    const data = JSON.parse(sessionData.data);
    return { id, data };
  }

  async create(id) {
    if (!id) throw new LocalBackend._BackendError('Invalid session ID', 400);
    await this._db.run('INSERT into sessions (id, data) VALUES (?, ?)', id, '{}');
    return {id, data: {}};
  }

  async update(id, data) {
    if (!id) throw new LocalBackend._BackendError('Invalid session ID', 400);
    await this._db.run(
      'UPDATE sessions SET data = ? WHERE id = ?',
      JSON.stringify(data),
      id,
    );
    return {id, data};
  }

  async delete(id) {
    if (!id) throw new LocalBackend._BackendError('Invalid session ID', 400);
    return this._db.run(
      'DELETE FROM sessions WHERE id = ?',
      id,
    );
  }
}

module.exports = LocalBackend;
LocalBackend._sqlite = sqlite;
LocalBackend._BackendError = BackendError;