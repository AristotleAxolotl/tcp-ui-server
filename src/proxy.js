/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const fetch = require('node-fetch');

export class Proxy {
  constructor() {
    this.url = '';
    this.mockData = {};
    this.filters = {};
  }

  setUrl(url) {
    this.url = url;
  }

  addFilter(method, filter, mock = false) {
    const filters = this.filters[method] || [];
    filter._MOCK = mock;
    this.filters[method] = [...filters, filter];
  }

  addMockFile(method, file) {
    return this.addMockData(method, require(file));
  }

  addMockData(method, data) {
    this.mockData[method] = data;
    // eslint-disable-next-line no-useless-return
    return;
  }

  addMock(method, data, filter) {
    if (typeof data === 'string') {
      console.warn('Proxy.addMock has been deprecated. Please use Proxy.addMockFile instead.');
      this.addMockFile(method, data);
    } else {
      console.warn('Proxy.addMock has been deprecated. Please use Proxy.addMockData instead.');
      this.addMockData(method, data);
    }
    if (typeof filter === 'function') {
      console.warn('Proxy.addMock has been deprecated. Please use Proxy.addFilter instead.');
      this.addFilter(method, filter);
    }
  }

  _createUrl(url, params) {
    if (!params) return url;

    const newUrl = new URL(new fetch.Request(this.url).url);
    const search = new URLSearchParams(newUrl.search);

    Object.keys(params).map(key => search.set(key, params[key]));

    newUrl.search = search;

    return newUrl;
  }

  async _makeRequest(method, params, body) {
    const url = this._createUrl(this.url, params);
    console.log('>> ', method, url.href);
    const r = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      method,
      body: body ? JSON.stringify(body) : null,
    });
    console.log('<< ', r.status, r.statusText);

    if (method === 'delete' || r.status !== 200) return null;

    return this._filterData({ method, params, body }, await r.json());
  }

  async _makeMockRequest(method, params, body) {
    const data = this.mockData[method] || this.mockData.all;
    if (!data) throw new Error(`🤯 Are you mocking me? I don't have mocked data for '${method}'!`);
    return this._filterData({ method, params, body }, data);
  }

  async _executeFilter(data, filter, request) {
    return !filter._MOCK || (filter._MOCK && process.env.MOCK) ? filter(data, request) : data;
  }

  async _filterData(request, data) {
    const filterChain = this.filters[request.method];
    if (!filterChain) return data;

    return filterChain.reduce(
      async (dataPromise, filter) => this._executeFilter(await dataPromise, filter, request),
      Promise.resolve(data),
    );
  }

  async _request(method, params, body) {
    if (!this.url) return Promise.reject(new Error('No URL configured for Proxy.'));
    if (process.env.MOCK) return this._makeMockRequest(method, params, body);
    return this._makeRequest(method, params, body);
  }

  async get(params) {
    return this._request('get', params);
  }

  async post(body, params) {
    return this._request('post', params, body);
  }

  async put(body, params) {
    return this._request('put', params, body);
  }

  async patch(body, params) {
    return this._request('patch', params, body);
  }

  async delete(params) {
    return this._request('delete', params);
  }
};
