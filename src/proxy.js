const fetch = require("node-fetch");

const Logger = require("./logger");

const logger = new Logger();

const ProxyError = require("./proxyError");

class Proxy {
  constructor(mock = false) {
    this._url = "";
    this._mockData = {};
    this._filters = {};
    this._mock = mock;
  }

  setUrl(url) {
    this._url = url;
  }

  setMockMode(mock) {
    this._mock = mock;
  }

  addFilter(method, filter, runInMockMode = false) {
    const filters = this._filters[method] || [];
    // eslint-disable-next-line no-param-reassign
    filter._MOCK = runInMockMode;
    this._filters[method] = [...filters, filter];
  }

  addMockFile(method, file) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return this.addMockData(method, Proxy._require(file));
  }

  addMockData(method, data) {
    this._mockData[method] = data;
  }

  addMock(method, data, filter) {
    if (typeof data === "string") {
      logger.error(
        "Proxy.addMock has been deprecated. Please use Proxy.addMockFile instead."
      );
      this.addMockFile(method, data);
    } else {
      logger.error(
        "Proxy.addMock has been deprecated. Please use Proxy.addMockData instead."
      );
      this.addMockData(method, data);
    }
    if (typeof filter === "function") {
      logger.error(
        "Proxy.addMock has been deprecated. Please use Proxy.addFilter instead."
      );
      this.addFilter(method, filter);
    }
  }

  _createUrl(url, params) {
    if (!params) return new URL(url);

    const newUrl = new URL(new Proxy._fetch.Request(this._url).url);
    const search = new URLSearchParams(newUrl.search);

    Object.keys(params).map((key) => search.set(key, params[key]));

    newUrl.search = search;

    return newUrl;
  }

  async _makeRequest(method, params, body) {
    const url = this._createUrl(this._url, params);
    logger.log(">> ", method, url.href);
    const r = await Proxy._fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      method,
      body: body ? JSON.stringify(body) : null,
    });

    logger.log("<< ", r.status, r.statusText);

    if (!r.ok) {
      const errorMessage = await r.json();
      if (errorMessage.error && errorMessage.error.response) {
        throw new ProxyError(
          `Upstream response: ${r.statusText}: ${errorMessage.error.response}`,
          r.status
        );
      }
      throw new ProxyError(
        `Upstream response: ${r.statusText}: ${errorMessage.error}: ${errorMessage.message}`,
        r.status
      );
    }

    if (method === "delete" || r.status === 204) return null;

    return this._filterData({ method, params, body }, await r.json());
  }

  async _makeMockRequest(method, params, body) {
    const data = this._mockData[method] || this._mockData.all;
    if (!data)
      throw new ProxyError(
        `🤯 Are you mocking me? I don't have mocked data for '${method}'!`,
        500
      );
    return this._filterData({ method, params, body }, data);
  }

  _areWeMocking() {
    return this._mock;
  }

  async _executeFilter(data, filter, request) {
    if (this._areWeMocking() && !filter._MOCK) return data;
    return filter(data, request);
  }

  async _filterData(request, data) {
    const filterChain = this._filters[request.method];
    if (!filterChain) return data;

    return filterChain.reduce(
      async (dataPromise, filter) =>
        this._executeFilter(await dataPromise, filter, request),
      Promise.resolve(data)
    );
  }

  async _request(method, params, body) {
    if (!this._url) throw new ProxyError("No URL configured for Proxy.", 500);
    if (this._areWeMocking()) {
      return this._makeMockRequest(method, params, body);
    }
    return this._makeRequest(method, params, body);
  }

  async get(params) {
    return this._request("get", params);
  }

  async post(body, params) {
    return this._request("post", params, body);
  }

  async put(body, params) {
    return this._request("put", params, body);
  }

  async patch(body, params) {
    return this._request("patch", params, body);
  }

  async delete(params) {
    return this._request("delete", params);
  }
}

module.exports = Proxy;
Proxy._fetch = fetch;
Proxy._require = require;
