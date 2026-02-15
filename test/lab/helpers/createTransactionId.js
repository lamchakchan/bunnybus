'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Helpers = require('../../../lib/helpers');

const { describe, before, beforeEach, after, it } = (exports.lab = Lab.script());
const expect = Code.expect;

describe('Helpers', () => {
    describe('createTransactionId', () => {
        it('should create a valid UUID token', async () => {
            let sut = null;

            try {
                const result = Helpers.createTransactionId();

                expect(result).to.be.a.string();
                expect(result).to.have.length(36);
                expect(result).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
            } catch (err) {
                sut = err;
            }

            expect(sut).to.not.exist();
        });

        it('should create only unique tokens', async () => {
            const iterations = 1000;

            const result = new Set();

            for (let i = 0; i < iterations; ++i) {
                result.add(Helpers.createTransactionId());
            }

            expect(result.size).to.equal(iterations);
        });
    });
});
