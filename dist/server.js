'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Server = undefined;

var _enum = require('./generator/enum');

const helmet = require('helmet'),
      app = require('express')(),
      http = require('http').Server(app),
      io = require('socket.io')(http);

class Server {
    constructor(config, generator) {
        this.app = app;
        this.io = io;

        app.set('json spaces', 4);
        app.use(helmet());
        app.get('/', function (req, res) {
            res.sendFile(__dirname + '/public/index.html');
        });

        io.on('connection', this.connect.bind(this));

        http.listen(config.port, function () {
            console.log('listening on *:' + config.port);
        });

        generator.on(_enum.Event.FILE_UPDATE, this.onFileUpdate.bind(this));
        generator.on(_enum.Event.QUEUE_COUNT, this.onQueueCount.bind(this));
        generator.on(_enum.Event.ERROR, this.onError.bind(this));
        this.generator = generator;
    }

    connect(socket) {
        this.onError(this.generator.getErrors());
    }

    onError(errors) {
        this.send(_enum.Event.ERROR, errors);
    }

    onFileUpdate(status, file) {
        this.send(_enum.Event.FILE_UPDATE, {
            status,
            file
        });
    }

    onQueueCount(count) {
        this.send(_enum.Event.QUEUE_COUNT, count);
    }

    send(event, payload) {
        this.io.emit(event, payload);
    }
}
exports.Server = Server;