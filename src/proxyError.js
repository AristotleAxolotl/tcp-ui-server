class ProxyError extends Error {

  constructor(message, statusCode) {
    super(message);
    this.httpStatus = statusCode;
  }

}

module.exports = ProxyError;