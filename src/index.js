import { Rackspace } from './rackspace';
import { FileStatus } from './enum';
import { File } from './file';
import { Cache } from './cache';
import { Queue } from './queue';

//TODO: save state
//TODO: overview html page
//TODO: email on failure

const credentials = require('../credentials.json'),
    config = require('../config.json'),
    fs = require('fs'),
    sharp = require('sharp'),
    moment = require('moment'),
    rp = require('request-promise');

class App {
    constructor(config) {
        this.config = config;
        this.initialized = false;
        this.catalog;

        const rackspace = new Rackspace(credentials);
        rackspace.on('token', this.onToken.bind(this));
        this.rackspace = rackspace;
        this.cache = new Cache();
        this.queue = {
            idle: new Queue(),
            active: new Queue({ concurrency: config.queueSize })
        };
        this.intervals = {
            tick: setInterval(this.tick.bind(this), 100),
            updateFileCache: setInterval(
                this.updateFileCache.bind(this),
                config.fileUpdateIntervalMinutes * 60 * 1000
            )
        };
    }

    initialize() {
        this.initialized = true;
    }

    tick() {
        const { idle, active } = this.queue;
        console.log(idle.size, active.size);

        for (let index = 0; index < active.space; index++) {
            if (idle.size === 0) {
                break;
            }
            const item = idle.shift();
            active.add(item);
        }

        for (let [key, file] of active.cache) {
            if (file.status === FileStatus.QUEUED) {
                this.compressQueuedImage(file);
            }
        }
    }

    async compressQueuedImage(file) {
        const { rackspace, cache } = this;
        const { active } = this.queue;
        const { tenantId, cloudFilesId, containerId, destinationPath } = this.config.target;
        try {
            file.status = FileStatus.DOWNLOADING;
            const image = await rackspace.downloadFile(
                tenantId,
                cloudFilesId,
                containerId,
                file.path
            );

            file.status = FileStatus.COMPRESSING;
            const resizedImage = await this.resizeImage(image);

            file.status = FileStatus.UPLOADING;
            const response = await rackspace.uploadFile(
                tenantId,
                cloudFilesId,
                containerId,
                destinationPath + file.uniquePath,
                resizedImage
            );

            file.status = FileStatus.COMPLETE;
            active.remove(file);

            if (String(response.statusCode).charAt(0) !== '2') {
                cache.remove(file.hash); // if the request failed, invalidate the cache so it gets reprocessed on next tick
            }
        } catch (error) {
            console.error(error);
        }
    }

    onToken(catalog) {
        this.catalog = catalog;

        if (!this.initialized) {
            this.initialize();
            this.updateFileCache();
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
                const file = new File(this.config.target.path, metadata),
                    isValidFiletype =
                        validFiletypes.filter(filetype => filetype === file.filetype).length === 1;

                if (!isValidFiletype) {
                    continue;
                }

                if (this.cache.isDirty(file) && !idle.has(file) && !active.has(file)) {
                    file.setStatus(FileStatus.QUEUED);
                    idle.add(file);
                    this.cache.add(file);
                }

                // console.log(this.queue);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async getFilesMetadata() {
        const { rackspace, catalog } = this;
        const { containerId, tenantId, cloudFilesId, path } = this.config.target;

        try {
            const serverExists = rackspace.helpers.cloudFileServerExists(
                catalog,
                tenantId,
                cloudFilesId
            );
            if (!serverExists) {
                throw new Error(
                    `https://storage101.${cloudFilesId}.clouddrive.com/v1/${tenantId} not found in Cloud File server list`
                );
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

const app = new App(config);
