'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
const zlib = require('zlib'),
      util = require('util');

class Zlib {
    static gzip(buffer) {
        return util.promisify(zlib.gzip)(buffer);
    }

    static gunzip(buffer) {
        return util.promisify(zlib.gunzip)(buffer);
    }
}
exports.Zlib = Zlib;