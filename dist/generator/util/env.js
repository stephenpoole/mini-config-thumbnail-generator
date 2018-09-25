'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Env = undefined;

var _env = require('../enum/env');

const currentEnv = _env.Env.value(process.env.NODE_ENV);

class Env {
    static isDevelopment() {
        return currentEnv === _env.Env.development;
    }

    static isProduction() {
        return currentEnv === _env.Env.production;
    }

    static get() {
        return currentEnv;
    }
}
exports.Env = Env;