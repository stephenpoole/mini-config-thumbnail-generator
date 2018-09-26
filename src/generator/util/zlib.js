const zlib = require('zlib'),
    util = require('util');

export class Zlib {
    static gzip(buffer) {
        return util.promisify(zlib.gzip)(buffer);
    }

    static gunzip(buffer) {
        return util.promisify(zlib.gunzip)(buffer);
    }
}
