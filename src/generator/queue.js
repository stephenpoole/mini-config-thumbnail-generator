import { Cache } from './cache';

export class Queue extends Cache {
    constructor({ concurrency = -1 } = {}) {
        super();
        this.concurrency = concurrency;
    }

    add(item) {
        const isFull = this.concurrency !== -1 && this.size === this.concurrency;
        if (!isFull) {
            super.add(item);
            return true;
        } else {
            return false;
        }
    }

    first() {
        const { cache } = this;
        if (cache.size === 0) {
            return undefined;
        } else {
            return cache.values().next().value;
        }
    }

    shift() {
        const { cache } = this;
        if (cache.size === 0) {
            return undefined;
        } else {
            const [key, value] = cache.entries().next().value;
            cache.delete(key);
            return value;
        }
    }

    pop() {
        const { cache } = this;
        if (cache.size === 0) {
            return undefined;
        } else {
            const [key, value] = Array.from(cache)[cache.size - 1];
            cache.delete(key);
            return value;
        }
    }

    get space() {
        return this.concurrency === -1
            ? Number.MAX_SAFE_INTEGER - this.size
            : Math.abs(this.concurrency - this.size);
    }
}
