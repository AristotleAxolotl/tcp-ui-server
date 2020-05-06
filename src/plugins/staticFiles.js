const express = require("express");

class StaticFiles {
  static register(app, instance, serverOpts) {
    if (serverOpts.path) { 
      console.log('calling');
      app.use(StaticFiles._express.static(serverOpts.path));
    }
  }

  static get loadPriority() {
    return 20;
  }
}

module.exports = StaticFiles;

StaticFiles._express = express;
