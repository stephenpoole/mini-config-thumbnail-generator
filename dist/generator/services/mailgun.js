'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Mailgun = undefined;

var _env = require('../util/env');

var mailgun = require('mailgun-js'),
    util = require('util');

class Mailgun {
    constructor(credentials) {
        this.mailgun = mailgun(credentials);
    }

    sendError(file, error) {
        return util.promisify(this.mailgun.messages().send)({
            from: 'MINIConfigurator',
            to: _env.Env.isProduction() ? 'support@richmondday.com' : 'stephen@richmondday.com',
            subject: `MINIConfigurator Error | ${!!file ? file.name + ' Upload Failed' : 'Generic'}`,
            text: `${!!file ? file.path + '<br>' : ''}${error.message}`
        });
    }
}
exports.Mailgun = Mailgun;