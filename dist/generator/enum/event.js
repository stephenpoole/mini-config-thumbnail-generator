'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Event = undefined;

var _enum = require('../util/enum');

const Event = exports.Event = new _enum.Enum(['READY', 'FILE_UPDATE', 'QUEUE_COUNT', 'ERROR']);