'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FileStatus = undefined;

var _enum = require('../util/enum');

const FileStatus = exports.FileStatus = new _enum.Enum(['IDLE', 'QUEUED', 'DOWNLOADING', 'COMPRESSING', 'UPLOADING', 'COMPLETE']);