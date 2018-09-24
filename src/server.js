import { Event } from './generator/enum';

const helmet = require('helmet'),
    app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http);

export class Server {
    constructor(config, generator) {
        this.app = app;
        this.io = io;

        app.set('json spaces', 4);
        app.use(helmet());
        app.get('/', function(req, res) {
            res.sendFile(__dirname + '/public/index.html');
        });

        io.on('connection', this.connect.bind(this));

        http.listen(config.port, function() {
            console.log('listening on *:' + config.port);
        });

        generator.on(Event.FILE_UPDATE, this.onFileUpdate.bind(this));
        generator.on(Event.QUEUE_COUNT, this.onQueueCount.bind(this));
    }

    connect(socket) {}

    onFileUpdate(status, file) {
        this.send(Event.FILE_UPDATE, {
            status,
            file
        });
    }

    onQueueCount(count) {
        this.send(Event.QUEUE_COUNT, count);
    }

    send(event, payload) {
        this.io.emit(event, payload);
    }
}
