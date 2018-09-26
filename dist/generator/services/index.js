'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mailgun = require('./mailgun');

Object.defineProperty(exports, 'Mailgun', {
  enumerable: true,
  get: function () {
    return _mailgun.Mailgun;
  }
});

var _rackspace = require('./rackspace');

Object.defineProperty(exports, 'Rackspace', {
  enumerable: true,
  get: function () {
    return _rackspace.Rackspace;
  }
});