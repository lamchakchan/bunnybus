'use strict';

const EventEmitter = require('events').EventEmitter;
const Hoek = require('@hapi/hoek');
const Denque = require('denque');
const { setIntervalAsync, clearIntervalAsync } = require('set-interval-async/dynamic');

class PartitionSerialDispatcher extends EventEmitter {
    static get DISPATCH_ERROR_EVENT() {
        return 'partitionSerialDispatcher.error';
    }

    constructor(config) {
        super();
        this._queues = new Map();
        this.config(config);
    }

    config({ serialDispatchPartitionKeySelectors = [] } = {}) {
        this.serialDispatchPartitionKeySelectors = serialDispatchPartitionKeySelectors.filter((x) => typeof x === 'string' && x.length > 0);
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
                        this.emit(PartitionSerialDispatcher.DISPATCH_ERROR_EVENT, error, queue);
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

    push(queue, delegate, payload) {
        let partitionKeySelector = '';

        if (this.serialDispatchPartitionKeySelectors.length && payload) {
            partitionKeySelector = this.serialDispatchPartitionKeySelectors
                .map((x) => Hoek.reachTemplate(payload, x))
                .find((x) => x && x.length);
        }

        const partitionKey = partitionKeySelector ? `${queue}:${partitionKeySelector}` : `${queue}:default`;

        (!this._queues.has(partitionKey) ? this._setupQueue(partitionKey) : this._queues.get(partitionKey)).buffer.push(delegate);
    }
}

module.exports = PartitionSerialDispatcher;
