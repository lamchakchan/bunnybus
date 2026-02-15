'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
    describe('performance', () => {
        describe('createTransactionId', () => {
            it('should generate 10000 transaction IDs within 100ms', async () => {
                const iterations = 10000;

                const start = process.hrtime.bigint();

                for (let i = 0; i < iterations; ++i) {
                    Helpers.createTransactionId();
                }

                const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

                expect(elapsed).to.be.below(100);
            });

            it('should generate unique IDs across 1000 calls', async () => {
                const ids = new Set();
                const iterations = 1000;

                for (let i = 0; i < iterations; ++i) {
                    ids.add(Helpers.createTransactionId());
                }

                expect(ids.size).to.equal(iterations);
            });
        });

        describe('buildPublishOrSendOptions', () => {
            it('should process 50000 option builds within 100ms', async () => {
                const iterations = 50000;
                const headers = {
                    transactionId: 'test-id',
                    isBuffer: false,
                    source: 'test-source',
                    routeKey: 'test.route',
                    createdAt: new Date().toISOString(),
                    bunnyBus: '9.0.0'
                };

                const options = {
                    expiration: '60000',
                    priority: 5,
                    persistent: true,
                    contentType: 'application/json',
                    routeKey: 'test.route'
                };

                const start = process.hrtime.bigint();

                for (let i = 0; i < iterations; ++i) {
                    Helpers.buildPublishOrSendOptions(options, headers);
                }

                const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

                expect(elapsed).to.be.below(100);
            });

            it('should correctly extract only allowed options', async () => {
                const headers = { transactionId: 'test' };
                const options = {
                    expiration: '60000',
                    priority: 5,
                    persistent: true,
                    routeKey: 'test.route',
                    customField: 'should-not-appear',
                    handler: () => {}
                };

                const result = Helpers.buildPublishOrSendOptions(options, headers);

                expect(result.headers).to.equal(headers);
                expect(result.expiration).to.equal('60000');
                expect(result.priority).to.equal(5);
                expect(result.persistent).to.be.true();
                expect(result.routeKey).to.not.exist();
                expect(result.customField).to.not.exist();
                expect(result.handler).to.not.exist();
            });

            it('should handle null options without error', async () => {
                const headers = { transactionId: 'test' };
                const result = Helpers.buildPublishOrSendOptions(null, headers);

                expect(result.headers).to.equal(headers);
                expect(Object.keys(result)).to.have.length(1);
            });
        });

        describe('convertToBuffer', () => {
            it('should convert 10000 objects to buffers within 100ms', async () => {
                const iterations = 10000;
                const message = { event: 'test.event', data: { name: 'bunnybus', count: 42 } };

                const start = process.hrtime.bigint();

                for (let i = 0; i < iterations; ++i) {
                    Helpers.convertToBuffer(message);
                }

                const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

                expect(elapsed).to.be.below(100);
            });
        });

        describe('parsePayload', () => {
            it('should parse 10000 payloads within 100ms', async () => {
                const iterations = 10000;
                const message = { event: 'test.event', data: { name: 'bunnybus' } };
                const content = Buffer.from(JSON.stringify(message));
                const payload = {
                    content,
                    properties: {
                        headers: {
                            isBuffer: false,
                            transactionId: 'test-id',
                            routeKey: 'test.event'
                        }
                    }
                };

                const start = process.hrtime.bigint();

                for (let i = 0; i < iterations; ++i) {
                    Helpers.parsePayload(payload);
                }

                const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

                expect(elapsed).to.be.below(100);
            });
        });

        describe('routeMatcher', () => {
            it('should match 50000 routes within 100ms using cached regex', async () => {
                const iterations = 50000;
                const pattern = 'order.*.created';
                const match = 'order.123.created';

                // Warm up the cache
                Helpers.routeMatcher(pattern, match);

                const start = process.hrtime.bigint();

                for (let i = 0; i < iterations; ++i) {
                    Helpers.routeMatcher(pattern, match);
                }

                const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

                expect(elapsed).to.be.below(100);
            });

            it('should match 10000 routes within 200ms with unique patterns', async () => {
                const iterations = 10000;

                const start = process.hrtime.bigint();

                for (let i = 0; i < iterations; ++i) {
                    Helpers.routeMatcher(`order.${i}.created`, `order.${i}.created`);
                }

                const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

                expect(elapsed).to.be.below(200);
            });
        });

        describe('handlerMatcher', () => {
            it('should match handlers across 10000 iterations within 100ms', async () => {
                const iterations = 10000;
                const handlers = {
                    'order.created': async () => {},
                    'order.updated': async () => {},
                    'order.deleted': async () => {},
                    'user.*': async () => {},
                    'payment.#': async () => {}
                };

                const start = process.hrtime.bigint();

                for (let i = 0; i < iterations; ++i) {
                    Helpers.handlerMatcher(handlers, 'order.created');
                }

                const elapsed = Number(process.hrtime.bigint() - start) / 1e6;

                expect(elapsed).to.be.below(100);
            });
        });
    });
});
