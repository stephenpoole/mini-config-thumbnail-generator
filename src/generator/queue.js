export class Queue {
    constructor({ concurrency = -1, rotating = false } = {}) {
        this.cache = [];
        this.concurrency = concurrency;
        this.rotating = rotating;
    }

    hydrate(data) {
        if (!data) {
            this.cache = [];
            return;
        }

        const { concurrency } = this;

        try {
            if (!Array.isArray(data)) {
                data = JSON.parse(data);
            }

            if (concurrency !== -1 && data.length > concurrency) {
                data.splice(data.length - 1 - concurrency, data.length - 1);
            }
            this.cache = data;
        } catch (error) {
            console.error(error);
            this.cache = [];
        }
    }

    add(item) {
        const isFull = this.concurrency !== -1 && this.size === this.concurrency,
            shouldRotate = isFull && this.rotating;

        if (shouldRotate) {
            this.shift();
        }
        if (!isFull || shouldRotate) {
            this.cache.push(item);
            return true;
        }
        return false;
    }

    first() {
        return this.cache[0];
    }

    last() {
        return this.cache[this.cache.length - 1];
    }

    shift() {
        return this.cache.shift();
    }

    pop() {
        return this.cache.pop();
    }

    getAll() {
        return this.cache;
    }

    get size() {
        return this.cache.length;
    }

    set size(value) {
        // not implemented
        throw new Error('not implemented');
    }

    get space() {
        return this.concurrency === -1
            ? Number.MAX_SAFE_INTEGER - this.cache.length
            : Math.abs(this.concurrency - this.cache.length);
    }

    set space(value) {
        // not implemented
        throw new Error('not implemented');
    }
}
