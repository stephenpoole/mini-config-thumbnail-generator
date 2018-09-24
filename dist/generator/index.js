'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ThumbGenerator = undefined;

var _rackspace = require('./rackspace');

var _enum = require('./enum');

var _file = require('./file');

var _cache = require('./cache');

var _queue = require('./queue');

var _storage = require('./storage');

var _stats = require('./stats');

const fs = require('fs'),
      EventEmitter = require('events'),
      md5 = require('md5'),
      sharp = require('sharp'),
      moment = require('moment'),
      rp = require('request-promise');

class ThumbGenerator extends EventEmitter {
    constructor(config, credentials) {
        super();
        this.config = config;
        this.initialized = false;
        this.catalog;
        this.readyCount = 0;

        const rackspace = new _rackspace.Rackspace(credentials);
        rackspace.on('token', this.onToken.bind(this));
        this.rackspace = rackspace;

        const storage = new _storage.Storage();
        storage.on('ready', this.onStorageReady.bind(this));
        this.storage = storage;

        const stats = new _stats.Stats(this);
        this.stats = stats;

        this.cache = new _cache.Cache();
        this.queue = {
            idle: new _queue.Queue(),
            active: new _queue.Queue({ concurrency: config.queueSize })
        };
        this.intervals = {
            tick: setInterval(this.tick.bind(this), 100),
            updateFileCache: setInterval(this.updateFileCache.bind(this), config.fileUpdateIntervalMinutes * 60 * 1000)
        };
    }

    onToken(catalog) {
        this.catalog = catalog;

        if (++this.readyCount === 2) {
            this.onReady();
        }
    }

    onStorageReady() {
        const { storage, cache } = this;
        const { idle } = this.queue;
        const hash = storage.get('hash'),
              currentHash = md5(this.config.target);

        // invalidate the cache if the target folder is different
        if (!!currentHash && hash === currentHash) {
            const cacheData = storage.get('cache');
            cache.hydrate(cacheData);

            for (let [key, item] of cache.getAll()) {
                if (item.status !== _enum.FileStatus.IDLE && item.status !== _enum.FileStatus.COMPLETE) {
                    item.status = _enum.FileStatus.QUEUED;
                    idle.add(item);
                }
            }
        }
        storage.set('hash', currentHash);

        if (++this.readyCount === 2) {
            this.onReady();
        }
    }

    async onReady() {
        this.initialize();
        await this.updateFileCache();
        this.emit(_enum.Event.READY);
    }

    initialize() {
        const { path, destinationPath } = this.config.target;
        if (path.charAt(path.length - 1) !== '/') {
            this.config.target.path += '/';
        }
        if (destinationPath.charAt(destinationPath.length - 1) !== '/') {
            this.config.target.destinationPath += '/';
        }

        this.initialized = true;
    }

    tick() {
        if (!this.initialized) {
            return;
        }

        const { idle, active } = this.queue;
        // console.log(idle.size, active.size);

        for (let index = 0; index < active.space; index++) {
            if (idle.size === 0) {
                break;
            }
            const item = idle.shift();
            active.add(item);
        }

        for (let [key, file] of active.cache) {
            if (file.status === _enum.FileStatus.QUEUED) {
                this.compressQueuedImage(file);
            }
        }

        this.emit(_enum.Event.QUEUE_COUNT, idle.size + active.size);
    }

    async compressQueuedImage(file) {
        const { rackspace, cache } = this;
        const { active } = this.queue;
        const { tenantId, cloudFilesId, containerId, destinationPath } = this.config.target;
        try {
            file.status = _enum.FileStatus.DOWNLOADING;
            this.emit(_enum.Event.FILE_UPDATE, file.status, file);
            const image = await rackspace.downloadFile(tenantId, cloudFilesId, containerId, file.path);

            file.status = _enum.FileStatus.COMPRESSING;
            this.emit(_enum.Event.FILE_UPDATE, file.status, file);
            const resizedImage = await this.resizeImage(image);

            file.status = _enum.FileStatus.UPLOADING;
            this.emit(_enum.Event.FILE_UPDATE, file.status, file);
            const response = await rackspace.uploadFile(tenantId, cloudFilesId, containerId, destinationPath + file.uniquePath, resizedImage);

            active.remove(file);
            file.status = _enum.FileStatus.COMPLETE;
            // console.log(this.cache.get(file).path);

            if (String(response.statusCode).charAt(0) !== '2') {
                cache.remove(file.hash); // if the request failed, invalidate the cache so it gets reprocessed on next tick
            } else {
                this.emit(_enum.Event.FILE_UPDATE, file.status, file);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async resizeImage(file) {
        const image = sharp(file);
        return image.metadata().then(({ width, height }) => {
            const minimumImageSize = this.config.ignoreImagesBelowPx;
            if (width <= minimumImageSize || height <= minimumImageSize) {
                return image;
            }
            return image.resize(Math.round(width / 2)).toBuffer();
        });
    }

    async updateFileCache() {
        const { initialized } = this;
        if (!initialized) {
            return;
        }

        try {
            const { idle, active } = this.queue,
                  metadatas = await this.getFilesMetadata(),
                  validFiletypes = this.config.filetypes;

            for (let metadata of metadatas) {
                if (!metadata.content_type.includes('image/')) {
                    continue;
                }

                const file = new _file.File(this.config.target.path, metadata),
                      isValidFiletype = validFiletypes.filter(filetype => filetype === file.filetype).length === 1;

                if (!isValidFiletype) {
                    continue;
                }

                if (this.cache.isDirty(file) && !idle.has(file) && !active.has(file)) {
                    file.setStatus(_enum.FileStatus.QUEUED);
                    idle.add(file);
                    this.cache.add(file);
                }
            }

            this.storage.set('cache', JSON.stringify([...this.cache.getAll()])); // convert map to json for storage
        } catch (error) {
            console.error(error);
        }
    }

    async getFilesMetadata() {
        const { rackspace, catalog } = this;
        const { containerId, tenantId, cloudFilesId, path } = this.config.target;

        try {
            const serverExists = rackspace.helpers.cloudFileServerExists(catalog, tenantId, cloudFilesId);
            if (!serverExists) {
                throw new Error(`https://storage101.${cloudFilesId}.clouddrive.com/v1/${tenantId} not found in Cloud File server list`);
            }
            const containers = await rackspace.cloudFile(tenantId, cloudFilesId);
            const containerExists = rackspace.helpers.containerExists(containers, containerId);
            if (!containerExists) {
                throw new Error(`${containerId} not found in container list`);
            }
            const files = await rackspace.getFiles(tenantId, cloudFilesId, containerId, path);
            return Promise.resolve(files);
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
exports.ThumbGenerator = ThumbGenerator;