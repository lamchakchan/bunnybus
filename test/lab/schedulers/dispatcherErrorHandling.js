'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const { SerialDispatcher, PartitionSerialDispatcher, ConcurrentDispatcher } = require('../../../lib/schedulers');

const { describe, beforeEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('schedulers', () => {
    describe('Dispatcher Error Handling', () => {
        describe('SerialDispatcher', () => {
            let instance = undefined;
            const queueName = 'test-serial-error-queue';

            beforeEach(() => {
                instance = new SerialDispatcher();
            });

            it('should emit error event when delegate throws', { timeout: 5000 }, async () => {
                const testError = new Error('handler failed');

                const errorPromise = new Promise((resolve) => {
                    instance.on(SerialDispatcher.DISPATCH_ERROR_EVENT, (err, queue) => {
                        resolve({ err, queue });
                    });
                });

                instance.push(queueName, async () => {
                    throw testError;
                });

                const result = await errorPromise;

                expect(result.err).to.equal(testError);
                expect(result.queue).to.equal(queueName);
            });

            it('should continue processing after a delegate error', { timeout: 5000 }, async () => {
                let successCount = 0;

                const promise = new Promise((resolve) => {
                    instance.push(queueName, async () => {
                        throw new Error('first fails');
                    });

                    instance.push(queueName, async () => {
                        ++successCount;
                    });

                    instance.push(queueName, async () => {
                        ++successCount;
                        resolve();
                    });
                });

                // Suppress unhandled error event
                instance.on(SerialDispatcher.DISPATCH_ERROR_EVENT, () => {});

                await promise;

                expect(successCount).to.equal(2);
            });

            it('should maintain serial ordering after error recovery', { timeout: 10000 }, async () => {
                const order = [];

                const promise = new Promise((resolve) => {
                    instance.push(queueName, async () => {
                        order.push(1);
                    });

                    instance.push(queueName, async () => {
                        order.push('error');
                        throw new Error('mid-stream error');
                    });

                    instance.push(queueName, async () => {
                        order.push(3);
                    });

                    instance.push(queueName, async () => {
                        order.push(4);
                        resolve();
                    });
                });

                instance.on(SerialDispatcher.DISPATCH_ERROR_EVENT, () => {});

                await promise;

                expect(order).to.equal([1, 'error', 3, 4]);
            });
        });

        describe('PartitionSerialDispatcher', () => {
            let instance = undefined;
            const queueName = 'test-partition-error-queue';

            beforeEach(() => {
                instance = new PartitionSerialDispatcher();
            });

            it('should emit error event when delegate throws', { timeout: 5000 }, async () => {
                const testError = new Error('partition handler failed');

                const errorPromise = new Promise((resolve) => {
                    instance.on(PartitionSerialDispatcher.DISPATCH_ERROR_EVENT, (err, queue) => {
                        resolve({ err, queue });
                    });
                });

                instance.push(queueName, async () => {
                    throw testError;
                });

                const result = await errorPromise;

                expect(result.err).to.equal(testError);
                expect(result.queue).to.contain(queueName);
            });

            it('should continue processing after a delegate error', { timeout: 5000 }, async () => {
                let successCount = 0;

                const promise = new Promise((resolve) => {
                    instance.push(queueName, async () => {
                        throw new Error('first fails');
                    });

                    instance.push(queueName, async () => {
                        ++successCount;
                    });

                    instance.push(queueName, async () => {
                        ++successCount;
                        resolve();
                    });
                });

                instance.on(PartitionSerialDispatcher.DISPATCH_ERROR_EVENT, () => {});

                await promise;

                expect(successCount).to.equal(2);
            });
        });

        describe('ConcurrentDispatcher', () => {
            let instance = undefined;
            const queueName = 'test-concurrent-error-queue';

            beforeEach(() => {
                instance = new ConcurrentDispatcher();
            });

            it('should execute delegate immediately', async () => {
                let executed = false;

                instance.push(queueName, () => {
                    executed = true;
                });

                expect(executed).to.be.true();
            });

            it('should not block subsequent pushes if a delegate throws', async () => {
                let secondExecuted = false;

                try {
                    instance.push(queueName, () => {
                        throw new Error('concurrent error');
                    });
                } catch (err) {
                    // expected
                }

                instance.push(queueName, () => {
                    secondExecuted = true;
                });

                expect(secondExecuted).to.be.true();
            });
        });
    });
});
