const fs = require('fs'),
    path = require('path'),
    EventEmitter = require('events');

import { Zlib } from './util/zlib';
import { OnExit } from './util/onExit';
import { Env } from './util/env';

export class Storage extends EventEmitter {
    constructor() {
        super();
        this.saving = false;
        this.saveRef = undefined;
        this.initialized = false;
        this.fileName = 'data.json';
        this.state = {};
        this.intervals = {
            tick: setInterval(this.tick.bind(this), 5000)
        };

        //OnExit.register(this.save.bind(this));
        this.initialize();
    }

    async initialize() {
        try {
            const buffer = await this.load();
            let data = buffer;

            if (Env.isProduction()) {
                data = await Zlib.gunzip(buffer);
            }
            this.state = JSON.parse(data);
        } catch (error) {
            console.error(error);
        } finally {
            this.initialized = true;
            this.emit('ready');
            this.tick();
        }
    }

    async tick() {
        if (this.saving || !this.initialized) {
            return;
        }

        this.saving = true;

        try {
            const data = JSON.stringify(this.state);
            let buffer = data;

            if (Env.isProduction()) {
                buffer = await Zlib.gzip(buffer);
            }
            this.saveRef = await this.save(buffer);
        } catch (error) {
            console.error(error);
        } finally {
            this.saveRef = undefined;
            this.saving = false;
        }
    }

    setAll(obj) {
        this.state = obj;
    }

    set(key, value) {
        this.state[key] = value;
    }

    getAll() {
        return this.state;
    }

    get(key, value) {
        if (key in this.state) {
            return this.state[key];
        } else {
            return undefined;
        }
    }

    load() {
        return new Promise((resolve, reject) => {
            fs.readFile(path.resolve(__dirname, this.fileName), (error, data) => {
                if (!!error || !data) {
                    reject(!!error ? error : 'Data was empty');
                } else {
                    try {
                        resolve(data);
                    } catch (error) {
                        reject(error);
                    }
                }
            });
        });
    }

    save(data) {
        if (!!this.saveRef) {
            return this.saveRef;
        }

        return new Promise((resolve, reject) => {
            fs.writeFile(path.resolve(__dirname, this.fileName), data, error => {
                if (!!error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
}
