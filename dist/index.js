'use strict';

var _generator = require('./generator');

var _server = require('./server');

const config = require('../config.json'),
      credentials = require('../credentials.json');

const generator = new _generator.ThumbGenerator(config, credentials);
const server = new _server.Server(config, generator);