import { Queue } from './queue';

export class FileQueue extends Queue {
    constructor(opts) {
        super(opts);
        this.filesByHash = {};
    }

    hydrate(data) {
        if (!data) {
            this.cache = [];
            return;
        }

        const { concurrency } = this;

        try {
            data = JSON.parse(data);
            if (concurrency !== -1 && data.length > concurrency) {
                data.splice(data.length - 1 - concurrency, data.length - 1);
            }
            this.cache = data;

            for (let [index, file] of this.cache) {
                this.filesByHash[file.hash] = index;
            }
        } catch (error) {
            console.error(error);
            this.cache = [];
        }
    }

    add(file) {
        if (!this.has(file)) {
            const added = super.add(file);

            if (added) {
                this.filesByHash[file.hash] = file;
            }
            return added;
        } else {
            const index = this.filesByHash[file.hash];
            this.cache[index] = file;
            return true;
        }
    }

    get(file) {
        if (file.hash in this.filesByHash) {
            return this.filesByHash[file.hash];
        } else {
            return false;
        }
    }

    has(file) {
        return file.hash in this.filesByHash;
    }

    remove(file) {
        if (this.has(file)) {
            const { cache } = this;
            for (let index = 0; index < cache.length; index++) {
                const currentFile = cache[index];
                if (currentFile.hash === file.hash) {
                    this.cache.splice(index, 1);
                    index--;
                }
            }
            delete this.filesByHash[file.hash];
            return true;
        }

        return false;
    }

    shift() {
        const file = this.first();
        delete this.filesByHash[file.hash];
        return super.shift();
    }

    pop() {
        const file = this.last();
        delete this.filesByHash[file.hash];
        return super.pop();
    }
}
