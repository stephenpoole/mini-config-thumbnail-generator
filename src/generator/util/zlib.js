const zlib = require('zlib');

export class Zlib {
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
