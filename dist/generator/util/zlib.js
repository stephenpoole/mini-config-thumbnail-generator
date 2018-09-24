'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
const zlib = require('zlib');

class Zlib {
    static gzip(buffer) {
        return new Promise((resolve, reject) => {
            zlib.gzip(buffer, (error, data) => {
                if (!!error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });
    }

    static gunzip(buffer) {
        return new Promise((resolve, reject) => {
            zlib.gunzip(buffer, (error, data) => {
                if (!!error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });
    }
}
exports.Zlib = Zlib;