'use strict';

const EventEmitter = require('events').EventEmitter;
const Denque = require('denque');
const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async/dynamic');

class SerialDispatcher extends EventEmitter {
    static get DISPATCH_ERROR_EVENT() {
        return 'serialDispatcher.error';
    }

    constructor() {
        super();
        this._queues = new Map();
    }

    _setupQueue(queue) {
        const context = {
            queue,
            buffer: new Denque(),
            intervalRef: setIntervalAsync(async () => {
                const ctx = this._queues.get(queue);

                if (!ctx) {
                    return;
                }

                const delegate = ctx.buffer.shift();

                if (delegate) {
                    try {
                        await delegate();
                    } catch (error) {
                        this.emit(SerialDispatcher.DISPATCH_ERROR_EVENT, error, queue);
                    }

                    if (!ctx.buffer.length) {
                        this._queues.delete(queue);
                        clearIntervalAsync(ctx.intervalRef);
                    }
                }
            }, 10)
        };

        this._queues.set(queue, context);

        return context;
    }

    push(queue, delegate) {
        // do not deconstruct this because it is a hot path
        (!this._queues.has(queue) ? this._setupQueue(queue) : this._queues.get(queue)).buffer.push(delegate);
    }
}

module.exports = SerialDispatcher;
