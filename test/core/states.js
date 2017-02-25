'use strict';

const Code = require('code');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const before = lab.before;
const beforeEach = lab.beforeEach;
const it = lab.it;
const expect = Code.expect;

const SubscriptionManager = require('../../lib/core/states/subscriptionManager');
let instance = undefined;

describe('state management', () => {

    describe('SubscriptionManager', () => {

        before((done) => {

            instance = new SubscriptionManager();
            done();
        });

        beforeEach((done) => {

            instance._subscriptions.clear();
            instance._blockQueues.clear();

            done();
        });

        describe('create', () => {

            const baseQueueName = 'subscription-createSubscription';

            it('should create one if it does not exist', (done) => {

                const queueName = `${baseQueueName}-1`;
                const handlers = { event1 : () => {} };
                const options = {};

                const response = instance.create(queueName, handlers, options);
                const sut = instance._subscriptions.get(queueName);

                expect(response).to.be.true();
                expect(sut).to.exist();
                expect(sut.handlers).to.exist();
                expect(sut.handlers.event1).to.be.a.function();
                expect(sut.options).to.exist();
                done();
            });

            it('should not create one if it does exist', (done) => {

                const queueName = `${baseQueueName}-2`;
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                const response = instance.create(queueName, handlers, options);

                expect(response).to.be.false();
                done();
            });

            it('should subscribe to `subscription.created` event', (done) => {

                const queueName = `${baseQueueName}-3`;
                const handlers = { event1 : () => {} };
                const options = {};

                instance.once(SubscriptionManager.CREATED_EVENT, (subcription) => {

                    expect(subcription).to.exist();
                    expect(subcription.handlers).to.exist();
                    expect(subcription.handlers.event1).to.be.a.function();
                    expect(subcription.options).to.exist();
                    done();
                });

                instance.create(queueName, handlers, options);
            });
        });

        describe('tag', () => {

            const baseQueueName = 'subscription-tagSubscription';

            it('should return true when subscription exist', (done) => {

                const queueName = `${baseQueueName}-1`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                const response = instance.tag(queueName, consumerTag);
                const sut = instance._subscriptions.get(queueName).hasOwnProperty('consumerTag');

                expect(response).to.be.true();
                expect(sut).to.be.true();

                done();
            });

            it('should return false when subscription does not exist', (done) => {

                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';

                const response = instance.tag(queueName, consumerTag);

                expect(response).to.be.false();

                done();
            });

            it('should subscribe to `subscription.tagged` event', (done) => {

                const queueName = `${baseQueueName}-3`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.once(SubscriptionManager.TAGGED_EVENT, (subcription) => {

                    expect(subcription).to.exist();
                    expect(subcription.consumerTag).to.be.equal(consumerTag);
                    expect(subcription.handlers).to.exist();
                    expect(subcription.handlers.event1).to.be.a.function();
                    expect(subcription.options).to.exist();
                    done();
                });

                instance.create(queueName, handlers, options);
                instance.tag(queueName, consumerTag);
            });
        });

        describe('get', () => {

            const baseQueueName = 'subscription-getSubscription';

            it('should return a subscription when it exist', (done) => {

                const queueName = `${baseQueueName}-1`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                instance.tag(queueName, consumerTag);
                const sut = instance.get(queueName);

                expect(sut).to.exist();
                expect(sut.consumerTag).to.be.equal(consumerTag);
                expect(sut.handlers).to.exist();
                expect(sut.handlers.event1).to.be.a.function();
                expect(sut.options).to.exist();
                done();
            });

            it('should return undefined when it does not exist', (done) => {

                const queueName = `${baseQueueName}-2`;
                const sut = instance.get(queueName);

                expect(sut).to.be.undefined();
                done();
            });
        });

        describe('clear', () => {

            const baseQueueName = 'subscription-clearSubscription';

            it('should return true when subscription is cleared', (done) => {

                const queueName = `${baseQueueName}-1`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                instance.tag(queueName, consumerTag);
                const response = instance.clear(queueName);
                const sut = instance._subscriptions.get(queueName).hasOwnProperty('consumerTag');

                expect(response).to.be.true();
                expect(sut).to.be.false();
                done();
            });

            it('should return false when subscription exist but does not have a consumerTag', (done) => {

                const queueName = `${baseQueueName}-2`;
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                const response = instance.clear(queueName);

                expect(response).to.be.false();
                done();
            });

            it('should return false when subscription does not exist', (done) => {

                const queueName = `${baseQueueName}-3`;

                const response = instance.clear(queueName);

                expect(response).to.be.false();
                done();
            });

            it('should subscribe to `subscription.cleared` event', (done) => {

                const queueName = `${baseQueueName}-4`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.once(SubscriptionManager.CLEARED_EVENT, (subcription) => {

                    expect(subcription).to.exist();
                    done();
                });

                instance.create(queueName, handlers, options);
                instance.tag(queueName, consumerTag);
                instance.clear(queueName);
            });
        });

        describe('clearAll', () => {

            const baseQueueName = 'subscription-clearAllSubscription';

            it('should return true when subscription is cleared', (done) => {

                const handlers = { event1 : () => {} };
                const options = {};
                const iterationLimit = 5;
                let iterationCount = 0;

                for (let i = 1; i <= iterationLimit; ++i) {
                    const queueName = `${baseQueueName}-${i}`;
                    const consumerTag = `abcdefg012345-${1}`;
                    instance.create(queueName, handlers, options);
                    instance.tag(queueName, consumerTag);
                }

                const eventHandler = (subscription) => {

                    ++iterationCount;

                    expect(subscription).to.exist();

                    if (iterationCount === iterationLimit) {
                        instance.removeListener(SubscriptionManager.CLEARED_EVENT, eventHandler);
                        done();
                    }
                };

                instance.on(SubscriptionManager.CLEARED_EVENT, eventHandler);
                instance.clearAll();
            });
        });

        describe('contains', () => {

            const baseQueueName = 'subscription-contains';

            it('should return false when subscription does not exist', (done) => {

                const queueName = `${baseQueueName}-1`;

                const response = instance.contains(queueName);

                expect(response).to.be.false();
                done();
            });

            it('should return true when subscription does exist', (done) => {

                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                instance.tag(queueName, consumerTag);
                const response = instance.contains(queueName);

                expect(response).to.be.true();
                done();
            });

            it('should return true when subscription does exist with removed consumerTag when using flag override', (done) => {

                const queueName = `${baseQueueName}-3`;
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                const response = instance.contains(queueName, false);

                expect(response).to.be.true();
                done();
            });
        });

        describe('remove', () => {

            const baseQueueName = 'subscription-removeSubscription';

            it('should return false when subscription does not exist', (done) => {

                const queueName = `${baseQueueName}-1`;

                const response = instance.remove(queueName);

                expect(response).to.be.false();
                done();
            });

            it('should return true when subscription exist', (done) => {

                const queueName = `${baseQueueName}-2`;
                const consumerTag = 'abcdefg012345';
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                instance.tag(queueName, consumerTag);
                const response = instance.remove(queueName);

                expect(response).to.be.true();
                done();
            });

            it('should return true when subscription exist with no consumerTag', (done) => {

                const queueName = `${baseQueueName}-2`;
                const handlers = { event1 : () => {} };
                const options = {};

                instance.create(queueName, handlers, options);
                const response = instance.remove(queueName);

                expect(response).to.be.true();
                done();
            });

            it('should subscribe to `subscription.removed` event', (done) => {

                const queueName = `${baseQueueName}-4`;
                const handlers = { event1 : () => {} };
                const options = {};

                instance.once(SubscriptionManager.REMOVED_EVENT, (subscription) => {

                    expect(subscription).to.exist();
                    done();
                });

                instance.create(queueName, handlers, options);
                instance.remove(queueName);
            });
        });

        describe('list', () => {

            const baseQueueName = 'subscription-listSubscription';

            it('should return 3 records when 3 were added', (done) => {

                for (let i = 1; i <= 3; ++i) {
                    const queueName = `${baseQueueName}-${i}`;
                    const handlers = { event1 : () => {} };
                    const options = {};

                    instance.create(queueName, handlers, options);
                }

                const results = instance.list();

                expect(results).to.have.length(3);
                done();
            });
        });

        describe('block/unblock/isBlocked', () => {

            it('should be true when blocking queue is unique', (done) => {

                const queueName = 'queue1';

                const result = instance.block(queueName);

                expect(result).to.be.true();
                done();
            });

            it('should be false when blocking queue is not unique', (done) => {

                const queueName = 'queue2';

                instance.block(queueName);
                const result = instance.block(queueName);

                expect(result).to.be.false();
                done();
            });

            it('should be true when unblocking queue exist', (done) => {

                const queueName = 'queue3';

                instance.block(queueName);
                const result = instance.unblock(queueName);

                expect(result).to.be.true();
                done();
            });

            it('should be false when unblocking queue does not exist', (done) => {

                const queueName = 'queue4';

                const result = instance.unblock(queueName);

                expect(result).to.be.false();
                done();
            });

            it('should subscribe to `subscription.blocked` event', (done) => {

                const queueName = 'queue5';

                instance.once(SubscriptionManager.BLOCKED_EVENT, (queue) => {

                    expect(queue).to.be.equal(queueName);
                    done();
                });

                instance.block(queueName);
            });

            it('should subscribe to `subscription.unblocked` event', (done) => {

                const queueName = 'queue6';

                instance.once(SubscriptionManager.UNBLOCKED_EVENT, (queue) => {

                    expect(queue).to.be.equal(queueName);
                    done();
                });

                instance.block(queueName);
                instance.unblock(queueName);
            });

            it('should be true when block queue exist', (done) => {

                const queueName = 'queue7';

                instance.block(queueName);
                const result = instance.isBlocked(queueName);

                expect(result).to.be.true();
                done();
            });

            it('should be false when block queue does not exist', (done) => {

                const queueName = 'queue8';

                const result = instance.isBlocked(queueName);

                expect(result).to.be.false();
                done();
            });
        });
    });
});
