'use strict';

const Code = require('code');
const Lab = require('lab');
const Async = require('async');
const Q = require('q');
const Bluebird = require('bluebird');
const PackageMeta = require('../../package.json');
const Assertions = require('./assertions');
const Helpers = require('../../lib/core/helpers');
const EventLogger = require('../../lib/core/loggers').EventLogger;

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const FakeLoggerFactory = (...levels) => {

    const logger = {};

    for (const level of levels) {
        logger[level] = () => {};
    }

    return logger;
};

describe('helpers', () => {

    describe('createTransactionId', () => {

        it('should create an 40 character long alphanumeric token', (done) => {

            Helpers.createTransactionId((err, result) => {

                expect(err).to.be.null();
                expect(result).to.be.a.string();
                expect(result).to.have.length(40);
                expect(result).to.match(/^([\d\w]*)$/);
                done();
            });
        });

        it('should create only unique tokens', (done) => {

            const iterations = 10000;

            Async.times(
                iterations,
                (n, cb) => {

                    Helpers.createTransactionId(cb);
                },
                (err, tokens) => {

                    const hash = {};

                    for (let i = 0; i < iterations; ++i) {
                        hash[tokens[i]] = (hash[tokens[i]] || 0) + 1;
                        expect(hash[tokens[i]]).to.be.equal(1);
                    }

                    expect(err).to.be.null();
                    done();
                });
        });
    });

    describe('getPackageData', () => {

        it('should return an identifier with {name, package} filled', (done) => {

            const result = Helpers.getPackageData();

            const semverMajor = PackageMeta.version.split('.', 1);

            expect(result).to.exist();
            expect(result.name).to.be.equal(PackageMeta.name);
            expect(result.version).to.be.equal(PackageMeta.version);
            expect(result.semverMatch).to.be.equal(semverMajor + '.x.x');
            done();
        });
    });

    describe('cleanObject', () => {

        it('should clean properties that have no values at first level', (done) => {

            const obj = {
                a : 'value1',
                b : null,
                c : undefined,
                d : 'value2'
            };

            Helpers.cleanObject(obj);

            const cleanedKeys = Object.keys(obj);

            expect(cleanedKeys.find((key) => key === 'b')).to.be.undefined();
            expect(cleanedKeys.find((key) => key === 'c')).to.be.undefined();

            done();
        });

        it('should clean properties that have no values at second level', (done) => {

            const obj = {
                a : {
                    a1 : 'value1',
                    a2 : null,
                    a3 : undefined,
                    a4 : 'value2'
                }
            };

            Helpers.cleanObject(obj);

            const cleanedKeys = Object.keys(obj.a);

            expect(cleanedKeys.find((key) => key === 'a2')).to.be.undefined();
            expect(cleanedKeys.find((key) => key === 'a3')).to.be.undefined();

            done();
        });
    });

    describe('convertToBuffer', () => {

        it('should convert a string to a Buffer', (done) => {

            const data = 'hello';

            Assertions.assertConvertToBuffer(data, done);
        });

        it('should convert an object to a Buffer', (done) => {

            const data = {
                a : 'root1',
                b : 'root2',
                c : {
                    c1 : 'sub1',
                    c2 : 'sub2'
                }
            };

            Assertions.assertConvertToBuffer(data, done);
        });

        it('should convert an array to a Buffer', (done) => {

            const data = ['a', 'b', 1, 2];

            Assertions.assertConvertToBuffer(data, done);
        });

        it('should not alter a Buffer input', (done) => {

            const data = new Buffer('hello');

            Assertions.assertConvertToBuffer(data, done);
        });
    });

    describe('isMajorCompatible', () => {

        it('should return true when major matches', (done) => {

            const result = Helpers.isMajorCompatible('1.2.3', '1.x.x');

            expect(result).to.be.true();
            done();
        });

        it('should return false when major does not match', (done) => {

            const result = Helpers.isMajorCompatible('2.1.3', '1.x.x');

            expect(result).to.be.false();
            done();
        });

        it('should return true when using package defaults', (done) => {

            const result = Helpers.isMajorCompatible(PackageMeta.version);

            expect(result).to.be.true();
            done();
        });
    });

    describe('reduceRouteKey', () => {

        const payloadHeaders = {
            properties : {
                headers : {
                    routeKey : 'a.b'
                }
            }
        };

        const payloadFields = {
            fields : {
                routingKey : 'a.c'
            }
        };

        const payload = {
            properties : payloadHeaders.properties,
            fieldds : payloadFields.fields
        };

        const message = {
            event : 'a.d'
        };

        const options = {
            routeKey : 'a.e'
        };

        it('should return from payload.properties.headers.routeKey when everything is supplied', (done) => {

            const result = Helpers.reduceRouteKey(payload, options, message);

            expect(result).to.be.equal(payload.properties.headers.routeKey);
            done();
        });

        it('should return from options.routeKey when payload contains fields.routingKey', (done) => {

            const result = Helpers.reduceRouteKey(payloadFields, options, message);

            expect(result).to.be.equal(options.routeKey);
            done();
        });

        it('should return from options.routeKey when payload is empty', (done) => {

            const result = Helpers.reduceRouteKey({}, options, message);

            expect(result).to.be.equal(options.routeKey);
            done();
        });

        it('should return from options.routeKey when payload is null', (done) => {

            const result = Helpers.reduceRouteKey(payloadFields, options, message);

            expect(result).to.be.equal(options.routeKey);
            done();
        });

        it('should return from message.event when options is empty', (done) => {

            const result = Helpers.reduceRouteKey(payloadFields, {}, message);

            expect(result).to.be.equal(message.event);
            done();
        });

        it('should return from message.event when options is null', (done) => {

            const result = Helpers.reduceRouteKey(payloadFields, null, message);

            expect(result).to.be.equal(message.event);
            done();
        });

        it('should return from payload.fields.routingKey when options is empty and message is empty', (done) => {

            const result = Helpers.reduceRouteKey(payloadFields, {}, {});

            expect(result).to.be.equal(payloadFields.fields.routingKey);
            done();
        });

        it('should return from payload.fields.routingKey when options is null and message is null', (done) => {

            const result = Helpers.reduceRouteKey(payloadFields, null, null);

            expect(result).to.be.equal(payloadFields.fields.routingKey);
            done();
        });

        it('should return undefined when all input is falsy', (done) => {

            const result = Helpers.reduceRouteKey(null, null, null);

            expect(result).to.be.undefined();
            done();
        });
    });

    describe('reduceCallback', () => {

        const callback = () => {};

        it('should return callback when given (callback)', (done) => {

            Assertions.assertReduceCallback(callback);
            done();
        });

        it('should return callback when given ({}, callback)', (done) => {

            Assertions.assertReduceCallback({}, callback);
            done();
        });

        it('should return callback when given (undefined, callback)', (done) => {

            Assertions.assertReduceCallback(undefined, callback);
            done();
        });

        it('should return callback when given (null, callback)', (done) => {

            Assertions.assertReduceCallback(null, callback);
            done();
        });

        it('should return callback when given ({}, null, callback)', (done) => {

            Assertions.assertReduceCallback({}, null, callback);
            done();
        });

        it('should return undefined when given ({})', (done) => {

            Assertions.assertUndefinedReduceCallback({});
            done();
        });

        it('should return undefined when given (undefined, undefined)', (done) => {

            Assertions.assertUndefinedReduceCallback(undefined, undefined);
            done();
        });

        it('should return undefined when given ()', (done) => {

            Assertions.assertUndefinedReduceCallback();
            done();
        });
    });

    describe('validateLoggerContract', () => {

        it('should return true when validating EventLogger', (done) => {

            Assertions.assertValidateLoggerContract(new EventLogger(), true, done);
        });

        it('should return true when validating custom logger object', (done) => {

            Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'warn', 'error', 'fatal'), true, done);
        });

        it('should return false when validating custom logger missing debug', (done) => {

            Assertions.assertValidateLoggerContract(FakeLoggerFactory('info', 'warn', 'error', 'fatal'), false, done);
        });

        it('should return false when validating custom logger missing info', (done) => {

            Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'warn', 'error', 'fatal'), false, done);
        });

        it('should return false when validating custom logger missing warn', (done) => {

            Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'error', 'fatal'), false, done);
        });

        it('should return false when validating custom logger missing error', (done) => {

            Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'warn', 'fatal'), false, done);
        });

        it('should return false when validating custom logger missing fatal', (done) => {

            Assertions.assertValidateLoggerContract(FakeLoggerFactory('debug', 'info', 'warn', 'error'), false, done);
        });
    });

    describe('validatePromiseContract', () => {

        it('should return true for native Promise', (done) => {

            expect(Helpers.validatePromiseContract(Promise)).to.be.true();
            done();
        });

        it('should return true for Bluebird', (done) => {

            expect(Helpers.validatePromiseContract(Bluebird)).to.be.true();
            done();
        });

        it('should return false for q', (done) => {

            expect(Helpers.validatePromiseContract(Q)).to.be.false();
            done();
        });

        it('should return false for non-promise constructor', (done) => {

            class BadPromise {}

            expect(Helpers.validatePromiseContract(BadPromise)).to.be.false();
            done();
        });
    });

    describe('toPromise', () => {

        const callback = () => {};

        describe('ES6 Promise', () => {

            it('should promisify methods using the native implementation', (done) => {

                //expect(instance.promise).to.be.equal(Promise);

                const task = Helpers.toPromise(Promise, callback);

                expect(task).to.be.instanceof(Promise);
                expect(task.then).to.be.a.function();
                done();
            });
        });

        describe('Bluebird Promise', () => {

            it('should promisify methods using the Bluebird implementation', (done) => {

                const task = Helpers.toPromise(Bluebird, callback);

                expect(task).to.be.instanceof(Bluebird);
                expect(task.then).to.be.a.function();
                done();
            });
        });
    });
});
