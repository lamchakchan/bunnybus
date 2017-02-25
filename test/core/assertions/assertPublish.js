'use strict';

const Async = require('async');
const Code = require('code');
const PackageMeta = require('../../../package.json');
const expect = Code.expect;

const assertPublish = (instance, message, queueName, routeKey, transactionId, source, shouldRoute, callback) => {

    const options = {
        routeKey,
        transactionId,
        source
    };

    Async.waterfall([
        instance.publish.bind(instance, message, options),
        instance.get.bind(instance, queueName, null)
    ],
    (err, payload) => {

        if (shouldRoute) {
            const subscribedMessage = JSON.parse(payload.content.toString());
            expect(err).to.be.null();
            expect(subscribedMessage).to.be.equal(message);
            expect(payload.properties.headers.transactionId).to.be.string();
            expect(payload.properties.headers.createdAt).to.exist();
            expect(payload.properties.headers.bunnyBus).to.exist();
            expect(payload.properties.headers.bunnyBus).to.be.equal(PackageMeta.version);

            if (routeKey) {
                expect(payload.properties.headers.routeKey).to.be.equal(routeKey);
            }
            else {
                expect(payload.properties.headers.routeKey).to.be.equal(message.event);
            }

            if (source) {
                expect(payload.properties.headers.source).to.be.string();
            }

            if (transactionId) {
                expect(payload.properties.headers.transactionId).to.be.equal(transactionId);
            }

            if (source) {
                expect(payload.properties.headers.source).to.be.equal(source);
            }

            instance.channel.ack(payload);
        }
        else {
            expect(err).to.be.null();
            expect(payload).to.be.false();
        }

        callback();
    });
};

module.exports = assertPublish;
