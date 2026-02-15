'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const { SubscriptionManager } = require('../../../lib/states');

const { describe, beforeEach, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('States', () => {
    describe('stability', () => {
        describe('SubscriptionManager', () => {
            let instance = undefined;
            const queueName = 'test-stability-queue';
            const handlers = { 'test.event': async () => {} };

            beforeEach(() => {
                instance = new SubscriptionManager();
            });

            it('should properly remove a subscription and clean up state', async () => {
                instance.create(queueName, handlers);
                instance.tag(queueName, 'consumer-tag-1');

                expect(instance.contains(queueName)).to.be.true();
                expect(instance.contains(queueName, false)).to.be.true();

                instance.remove(queueName);

                expect(instance.contains(queueName)).to.be.false();
                expect(instance.contains(queueName, false)).to.be.false();
                expect(instance.get(queueName)).to.be.undefined();
            });

            it('should allow re-creation after removal', async () => {
                instance.create(queueName, handlers);
                instance.tag(queueName, 'tag-1');

                instance.remove(queueName);
                expect(instance.contains(queueName, false)).to.be.false();

                const created = instance.create(queueName, handlers);
                expect(created).to.be.true();
                expect(instance.contains(queueName, false)).to.be.true();
            });

            it('should handle rapid block/unblock cycles', async () => {
                instance.create(queueName, handlers);

                for (let i = 0; i < 100; ++i) {
                    instance.block(queueName);
                    expect(instance.isBlocked(queueName)).to.be.true();

                    instance.unblock(queueName);
                    expect(instance.isBlocked(queueName)).to.be.false();
                }
            });

            it('should not duplicate when blocking an already blocked queue', async () => {
                instance.create(queueName, handlers);

                const firstBlock = instance.block(queueName);
                const secondBlock = instance.block(queueName);

                expect(firstBlock).to.be.true();
                expect(secondBlock).to.be.false();

                instance.unblock(queueName);
                expect(instance.isBlocked(queueName)).to.be.false();
            });

            it('should list return independent copies', async () => {
                instance.create(queueName, handlers);
                instance.tag(queueName, 'tag-1');

                const list1 = instance.list();
                const list2 = instance.list();

                expect(list1).to.not.shallow.equal(list2);
                expect(list1[0]).to.not.shallow.equal(list2[0]);
            });

            it('should handle remove on non-existent queue', async () => {
                const result = instance.remove('non-existent');

                expect(result).to.be.false();
            });

            it('should handle multiple subscriptions independently', async () => {
                const queue1 = 'test-queue-1';
                const queue2 = 'test-queue-2';
                const queue3 = 'test-queue-3';

                instance.create(queue1, handlers);
                instance.create(queue2, handlers);
                instance.create(queue3, handlers);

                instance.tag(queue1, 'tag-1');
                instance.tag(queue2, 'tag-2');
                instance.tag(queue3, 'tag-3');

                instance.remove(queue2);

                expect(instance.contains(queue1)).to.be.true();
                expect(instance.contains(queue2)).to.be.false();
                expect(instance.contains(queue3)).to.be.true();
                expect(instance.list()).to.have.length(2);
            });
        });
    });
});
