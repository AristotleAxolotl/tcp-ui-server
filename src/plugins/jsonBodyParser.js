const express = require("express");

class JsonBodyParser {
  static register(app) {
    app.use(JsonBodyParser._express.json());
  }

  static get loadPriority() {
    return 10;
  }
}

JsonBodyParser._express = express;

module.exports = JsonBodyParser;
