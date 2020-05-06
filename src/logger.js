/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
class Logger {

    log(...args)  {
        if (process.env.QUIET || process.env.SILENT) return;
        Logger._console.log(...args);
    }

    error(...args) {
        if (process.env.SILENT) return;
        Logger._console.log(...args);
    }

}

Logger._console = console;

module.exports = Logger;