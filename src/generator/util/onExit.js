export class OnExit {
    static register(fn, async = false) {
        if (typeof fn !== 'function') {
            return;
        }
        const handle = this.handler.bind(undefined, fn, async);
        process.on('exit', handle);
        process.on('SIGINT', handle);
        process.on('SIGUSR1', handle);
        process.on('SIGUSR2', handle);
        process.on('SIGTERM', handle);
        process.on('uncaughtException', handle);
    }

    static handler(fn, async) {
        process.stdin.resume();
        if (async) {
            fn().finally(() => process.exit());
        } else {
            fn();
            process.exit();
        }
    }
}
