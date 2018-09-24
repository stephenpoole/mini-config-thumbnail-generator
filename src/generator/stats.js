import { FileStatus, Event } from './enum';

export class Stats {
    constructor(app) {
        this.state = this.model();
        this.storage = app.storage;
        app.on(Event.READY, this.initialize.bind(this));
        app.on(Event.FILE_UPDATE, this.onFileUpdate.bind(this));
    }

    initialize() {
        let { storage, state } = this;
        const currentState = storage.get('stats');
        state = !!currentState ? currentState : state;
    }

    onFileUpdate(status, file) {
        const { COMPLETE } = FileStatus;

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
