'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Stats = undefined;

var _enum = require('./enum');

class Stats {
    constructor(app) {
        this.state = this.model();
        this.storage = app.storage;
        app.on(_enum.Event.READY, this.initialize.bind(this));
        app.on(_enum.Event.FILE_UPDATE, this.onFileUpdate.bind(this));
    }

    initialize() {
        let { storage, state } = this;
        const currentState = storage.get('stats');
        state = !!currentState ? currentState : state;
    }

    onFileUpdate(status, file) {
        const { COMPLETE } = _enum.FileStatus;

        switch (status) {
            case COMPLETE:
                this.increment('complete');
                break;
        }
    }

    increment(key) {
        const { state } = this;
        if (key in state) {
            state[key] = ++state[key];
        } else {
            state[key] = 0;
        }

        this.store();
    }

    store() {
        this.storage.set('stats', this.state);
    }

    model() {
        return {
            complete: 0
        };
    }
}
exports.Stats = Stats;