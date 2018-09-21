'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
class Cache {
    constructor() {
        this.cache = new Map();
    }

    has(file) {
        return this.cache.has(file.hash);
    }

    isDirty(file) {
        if (this.has(file)) {
            const currentFile = this.get(file);
            return file.last_modified.isAfter(currentFile.last_modified);
        } else {
            return true;
        }
    }

    add(file) {
        this.cache.set(file.hash, file);
    }

    get(file) {
        return this.cache.get(file.hash);
    }

    remove(file) {
        this.cache.delete(file.hash);
    }

    get size() {
        return this.cache.size;
    }

    set size(value) {
        // not implemented
        throw new Error('Not implemented');
    }
}
exports.Cache = Cache;