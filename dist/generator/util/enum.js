"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
class Enum extends Array {
    constructor(obj) {
        super();
        if (Array.isArray(obj)) {
            this.data = {};
            obj.map((item, index) => this.data[item] = index);
        } else {
            this.data = obj;
        }

        Object.entries(this.data).map(([key, index]) => {
            this[key] = index;
            this[index] = key;
        });
    }

    key(index = 0) {
        if (index > this.length - 1 || index < 0) {
            return undefined;
        } else {
            return this[index];
        }
    }

    value(val) {
        if (val in this) {
            return this[val];
        } else {
            return undefined;
        }
    }

    keys() {
        return Object.keys(this.data);
    }

    values() {
        return Object.values(this.data);
    }

    has(val) {
        return val in this;
    }

    size() {
        return Object.keys(this.data).length;
    }
}
exports.Enum = Enum;