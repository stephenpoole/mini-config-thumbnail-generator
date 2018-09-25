'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const rp = require('request-promise'),
      moment = require('moment'),
      EventEmitter = require('events');

class Rackspace extends EventEmitter {
    constructor(config = {}) {
        super();
        this.identUri = 'https://identity.api.rackspacecloud.com/v2.0';
        this.config = config;
        this.authToken = '';
        this.authTokenExpiry;
        this.helpers = Helpers;

        this._interval = setInterval(this._tick.bind(this), 5 * 60 * 1000);
        this._tick();
    }

    token() {
        const { username, apiKey } = this.config;
        return this.request('/tokens', {
            uri: this.identUri,
            method: 'POST',
            body: {
                auth: {
                    'RAX-KSKEY:apiKeyCredentials': {
                        username,
                        apiKey
                    }
                }
            }
        });
    }

    cdn(tenantId, cdnId) {
        return this.request('', {
            uri: `https://cdn${cdnId}.clouddrive.com/v1/${tenantId}`
        });
    }

    cloudFile(tenantId, fileServerId) {
        return this.request('', {
            uri: `https://storage101.${fileServerId}.clouddrive.com/v1/${tenantId}`
        });
    }

    getFiles(tenantId, fileServerId, containerId, path, marker) {
        return this.request('', {
            uri: `https://storage101.${fileServerId}.clouddrive.com/v1/${tenantId}/${containerId}`,
            qs: {
                prefix: path,
                marker
            }
        });
    }

    async getAllFiles(tenantId, fileServerId, containerId, path) {
        let files = [],
            marker;

        try {
            while (true) {
                const result = await this.getFiles(tenantId, fileServerId, containerId, path, marker);
                marker = result[result.length - 1].name;
                files = files.concat(result);

                // request limit
                if (result.length !== 10000) {
                    break;
                }
            }

            return Promise.resolve(files);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    downloadFile(tenantId, fileServerId, containerId, path) {
        return this.request(`/${path}`, {
            uri: `https://storage101.${fileServerId}.clouddrive.com/v1/${tenantId}/${containerId}`,
            json: false
        });
    }

    uploadFile(tenantId, fileServerId, containerId, path, payload) {
        return this.request('', {
            uri: `https://storage101.${fileServerId}.clouddrive.com/v1/${tenantId}/${containerId}/${path}`,
            json: false,
            method: 'PUT',
            body: payload,
            resolveWithFullResponse: true, // pass the full response instead of just the body
            simple: false, // only throw an error on 5xx
            headers: {
                'Content-Length': payload.length
            }
        });
    }

    async _tick() {
        const { authTokenExpiry } = this;
        const isExpired = !!authTokenExpiry && authTokenExpiry.clone().subtract(1, 'hours').isBefore(moment());

        if (!authTokenExpiry || isExpired) {
            try {
                const { access } = await this.token();
                this.authTokenExpiry = moment(access.token.expires); // 2018-09-21T18:44:29.515Z
                this.authToken = access.token.id;
                console.info(`Got new token: ${this.authToken} ${this.authTokenExpiry}`);
                this.emit('token', access.serviceCatalog);
            } catch (error) {
                console.error('Token refresh failed, retrying in 60s', error);
            }
        }
    }

    request(path, {
        uri = '',
        method = 'GET',
        body = undefined,
        qs = {},
        json = true,
        headers = {},
        resolveWithFullResponse = false,
        simple = true
    } = {}) {
        return rp({
            body: !!body ? body : !!json ? {} : '',
            qs,
            encoding: null,
            method,
            uri: uri + path,
            json,
            resolveWithFullResponse,
            headers: _extends({}, headers, {
                'X-Auth-Token': this.authToken
            })
        });
    }
}

exports.Rackspace = Rackspace;
class Helpers {
    static cloudFileServerExists(catalog, targetTenantId, targetCloudFileServerId) {
        for (let service of catalog) {
            const { name, endpoints } = service;

            if (name === 'cloudFiles') {
                for (let cfs of endpoints) {
                    const { tenantId, publicURL } = cfs;

                    if (targetTenantId === tenantId && publicURL === `https://storage101.${targetCloudFileServerId}.clouddrive.com/v1/${targetTenantId}`) {
                        return true;
                    }
                }

                return false;
            }
        }

        return false;
    }

    static containerExists(list, containerId) {
        for (let container of list) {
            const { name } = container;
            if (name === containerId) {
                return true;
            }
        }
        return false;
    }
}